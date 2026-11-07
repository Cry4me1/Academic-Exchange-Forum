/**
 * 图像内容安全审核服务 (基于百度智能云「内容审核平台-图像」API)
 * 接口地址: https://aip.baidubce.com/rest/2.0/solution/v1/img_censor/v2/user_defined
 */

interface BaiduTokenCache {
  apiKey: string;
  accessToken: string;
  expiresAt: number;
}

export interface BaiduImageAuditOptions {
  /** 0: 静态图片, 1: GIF动态图片（不传则自动根据 GIF 头部/后缀识别） */
  imgType?: 0 | 1;
  /** 百度内容审核平台-策略中心配置的策略 ID */
  strategyId?: number | string;
  /** 用户自定义参数 ID（用于百度后台-数据统计-用户风险统计） */
  userId?: string;
  /** 用户客户端 IP */
  userIp?: string;
}

export interface BaiduViolationDetail {
  type?: number;
  subType?: number;
  typeLabel: string;
  msg: string;
  probability?: number;
  datasetName?: string;
  stars?: string[];
  words?: string[];
  codes?: string[];
}

const BAIDU_TYPE_LABELS: Record<number, string> = {
  0: "官方违禁图库",
  1: "不当图像(旧版)",
  2: "危险场景(旧版)",
  3: "不适图像",
  4: "广告/条码检测",
  5: "敏感/公众人物",
  6: "图像质量检测",
  7: "自定义图像黑库",
  8: "自定义图像白库",
  10: "头像规范检测",
  11: "图文违禁词库",
  12: "图文合规(旧版)",
  13: "自定义文本黑名单",
  14: "自定义文本白名单",
  15: "EasyDL自定义模型",
  16: "敏感标志/图形",
  21: "违禁要素(旧版)",
  24: "直播场景检测",
  38: "受限媒体来源",
  39: "公众人物识别",
  40: "官方增强场景库",
  41: "自定义场景库",
  42: "敏感要素识别(新版)",
  43: "低俗不当识别(新版)",
  44: "高危场景识别(新版)",
  45: "违禁物品识别(新版)",
  47: "广告法合规",
  1230: "图文-敏感要素",
  1231: "图文-高危场景",
  1232: "图文-违禁信息",
  1233: "图文-低俗信息",
  1234: "图文-不文明用语",
  1235: "图文-不良导向",
  1236: "图文-营销引流广告",
  1237: "图文-违规营销文案",
  1238: "图文-隐私信息",
  1239: "图文-低质灌水",
};

/**
 * 解析百度返回的 data 数组，提取细粒度违规详情与可读摘要
 */
function parseBaiduDataDetails(rawItems: any[]): {
  violations: BaiduViolationDetail[];
  matchedWords: string[];
  summaryText: string;
} {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { violations: [], matchedWords: [], summaryText: "" };
  }

  const allWords = new Set<string>();
  const violations: BaiduViolationDetail[] = rawItems.map((item: any) => {
    const typeNum = typeof item?.type === "number" ? item.type : undefined;
    const subTypeNum = typeof item?.subType === "number" ? item.subType : undefined;
    const typeLabel =
      (typeNum !== undefined ? BAIDU_TYPE_LABELS[typeNum] : undefined) ||
      (typeNum !== undefined ? `模型#${typeNum}` : "内容安全规则");

    const stars: string[] = Array.isArray(item?.stars)
      ? item.stars.map((s: any) => s?.name).filter(Boolean)
      : [];

    const words: string[] = [];
    if (Array.isArray(item?.hits)) {
      for (const hit of item.hits) {
        if (Array.isArray(hit?.words)) {
          for (const w of hit.words) {
            if (typeof w === "string" && w.trim()) {
              words.push(w.trim());
              allWords.add(w.trim());
            }
          }
        }
        if (Array.isArray(hit?.wordHitPositions)) {
          for (const pos of hit.wordHitPositions) {
            if (typeof pos?.keyword === "string" && pos.keyword.trim()) {
              words.push(pos.keyword.trim());
              allWords.add(pos.keyword.trim());
            }
          }
        }
        if (typeof hit?.label === "string" && hit.label.trim()) {
          words.push(hit.label.trim());
        }
      }
    } else if (item?.hits && typeof item.hits === "object" && item.hits.label) {
      words.push(String(item.hits.label));
    }

    const codes: string[] = Array.isArray(item?.codes)
      ? item.codes.map((c: any) => String(c)).filter(Boolean)
      : [];

    const probability =
      typeof item?.probability === "number" ? item.probability : undefined;

    return {
      type: typeNum,
      subType: subTypeNum,
      typeLabel,
      msg: item?.msg || item?.error_msg || typeLabel,
      probability,
      datasetName: item?.datasetName || undefined,
      stars: stars.length > 0 ? Array.from(new Set(stars)) : undefined,
      words: words.length > 0 ? Array.from(new Set(words)) : undefined,
      codes: codes.length > 0 ? codes : undefined,
    };
  });

  const summaryParts = violations.map((v) => {
    const extras: string[] = [];
    if (v.probability !== undefined) {
      extras.push(`置信度 ${(v.probability * 100).toFixed(1)}%`);
    }
    if (v.stars && v.stars.length > 0) {
      extras.push(`识别对象: ${v.stars.join("/")}`);
    }
    if (v.words && v.words.length > 0) {
      extras.push(`命中词: ${v.words.slice(0, 3).join("/")}`);
    }
    if (v.codes && v.codes.length > 0) {
      extras.push(`条码内容: ${v.codes.slice(0, 2).join("/")}`);
    }
    return extras.length > 0
      ? `[${v.typeLabel}] ${v.msg}（${extras.join("，")}）`
      : `[${v.typeLabel}] ${v.msg}`;
  });

  return {
    violations,
    matchedWords: Array.from(allWords),
    summaryText: summaryParts.join("；"),
  };
}

let tokenCache: BaiduTokenCache | null = null;

/** 百度要求 Base64 编码后大小不超过 10MB */
const MAX_BASE64_LENGTH = 10 * 1024 * 1024;
/** 远程图片转 Base64 的二进制上限（约 7MB 二进制 ≈ 9.3MB Base64 < 10MB） */
const MAX_REMOTE_FETCH_BYTES = 7 * 1024 * 1024;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 自动判断是否为 GIF 动态图（GIF87a / GIF89a 的 Base64 均以 R0lGOD 开头）
 */
function detectImgType(
  cleanBase64?: string,
  imageUrl?: string,
  explicitImgType?: 0 | 1
): 0 | 1 {
  if (explicitImgType === 0 || explicitImgType === 1) {
    return explicitImgType;
  }
  if (cleanBase64 && cleanBase64.startsWith("R0lGOD")) {
    return 1;
  }
  if (imageUrl && /\.gif(?:$|[?#])/i.test(imageUrl)) {
    return 1;
  }
  return 0;
}

/**
 * 尝试将远程图片拉取为 Base64（避免百度国内机房拉取海外 R2/CDN 超时或失败）
 */
async function tryFetchRemoteAsBase64(
  imageUrl: string
): Promise<{ base64: string; isGif: boolean } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const res = await fetch(imageUrl, { signal: controller.signal });
    if (!res.ok) return null;

    const contentLength = Number(res.headers.get("content-length") || "0");
    if (contentLength > MAX_REMOTE_FETCH_BYTES) return null;

    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength === 0 || arrayBuffer.byteLength > MAX_REMOTE_FETCH_BYTES) {
      return null;
    }

    const base64 = Buffer.from(arrayBuffer).toString("base64");
    if (base64.length >= MAX_BASE64_LENGTH) return null;

    return {
      base64,
      isGif: contentType.includes("image/gif") || base64.startsWith("R0lGOD"),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 获取百度开放平台 Access Token
 */
export async function getBaiduAccessToken(): Promise<string | null> {
  const apiKey = process.env.BAIDU_IMAGE_CENSOR_API_KEY?.trim();
  const secretKey = process.env.BAIDU_IMAGE_CENSOR_SECRET_KEY?.trim();

  if (!apiKey || !secretKey) {
    return null;
  }

  const now = Date.now();
  if (
    tokenCache &&
    tokenCache.apiKey === apiKey &&
    tokenCache.expiresAt > now + 60 * 1000
  ) {
    return tokenCache.accessToken;
  }

  try {
    const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(secretKey)}`;
    const res = await fetch(url, { method: "POST" });
    const data = await res.json();

    if (data.access_token) {
      tokenCache = {
        apiKey,
        accessToken: data.access_token,
        expiresAt: now + (data.expires_in || 2592000) * 1000,
      };
      return data.access_token;
    }

    console.error("[ImageModerator] 获取百度 Access Token 失败:", data);
    return null;
  } catch (err) {
    console.error("[ImageModerator] 请求百度 Access Token 异常:", err);
    return null;
  }
}

export interface ImageAuditItemResult {
  imageUrl?: string;
  isSafe: boolean;
  isSensitive: boolean;
  isDangerous: boolean;
  isDegraded?: boolean;
  score: number;
  violationReason?: string;
  violations?: BaiduViolationDetail[];
  matchedWords?: string[];
  baiduLogId?: string | number;
  details?: Record<string, any>;
  hasBaiduConfigured?: boolean;
}

export interface ImageAuditOverallResult {
  hasImages: boolean;
  imageCount: number;
  isAllSafe: boolean;
  hasDangerous: boolean;
  hasSensitive: boolean;
  hasDegraded?: boolean;
  degradedReasons?: string[];
  matchedWords?: string[];
  reasons: string[];
  itemResults: ImageAuditItemResult[];
}

/**
 * 审核单张图片源（严格对齐百度「内容审核平台-图像」官方接口规范）
 */
export async function auditSingleImageSource(
  source: { imageUrl?: string; imageBase64?: string },
  token?: string | null,
  options?: BaiduImageAuditOptions
): Promise<ImageAuditItemResult> {
  const imageUrl = source.imageUrl;
  const imageBase64 = source.imageBase64;

  const accessToken = token || (await getBaiduAccessToken());

  // 若未配置百度图像审核 Key，记录警告并降级放行
  if (!accessToken) {
    console.warn("[ImageModerator] 百度图片审核 API Key 未配置，已处于降级放行模式");
    return {
      imageUrl,
      isSafe: true,
      isSensitive: false,
      isDangerous: false,
      isDegraded: true,
      score: 100,
      violationReason: "未配置百度审核密钥（降级放行）",
      hasBaiduConfigured: false,
    };
  }

  const apiUrl = `https://aip.baidubce.com/rest/2.0/solution/v1/img_censor/v2/user_defined?access_token=${encodeURIComponent(accessToken)}`;

  const bodyParams = new URLSearchParams();
  let resolvedImgType: 0 | 1 = 0;

  if (imageBase64) {
    // 百度规范要求去除图像头（如 data:image/jpg;base64,）且 Base64 大小不超过 10MB
    const cleanBase64 = imageBase64
      .replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "")
      .trim();

    if (cleanBase64.length >= MAX_BASE64_LENGTH) {
      return {
        imageUrl,
        isSafe: false,
        isSensitive: true,
        isDangerous: false,
        isDegraded: false,
        score: 65,
        violationReason: "图片编码后体积超过百度审核 10MB 上限，已转入人工审核",
        hasBaiduConfigured: true,
      };
    }

    bodyParams.append("image", cleanBase64);
    resolvedImgType = detectImgType(cleanBase64, imageUrl, options?.imgType);
  } else if (imageUrl) {
    // 优先由服务端拉取图片二进制转 Base64 提交（避免百度机房跨境拉取 R2 缓慢或超时），失败则回退 imgUrl
    const fetched = await tryFetchRemoteAsBase64(imageUrl);
    if (fetched) {
      bodyParams.append("image", fetched.base64);
      resolvedImgType = options?.imgType ?? (fetched.isGif ? 1 : 0);
    } else {
      bodyParams.append("imgUrl", imageUrl);
      resolvedImgType = detectImgType(undefined, imageUrl, options?.imgType);
    }
  } else {
    return {
      imageUrl,
      isSafe: true,
      isSensitive: false,
      isDangerous: false,
      isDegraded: true,
      score: 100,
      violationReason: "未提供有效的图片数据，降级放行",
      hasBaiduConfigured: true,
    };
  }

  // 附带可选官方参数：imgType (0静态/1动态GIF)、strategyId、userId、userIp
  bodyParams.append("imgType", String(resolvedImgType));

  const strategyId =
    options?.strategyId ?? process.env.BAIDU_IMAGE_CENSOR_STRATEGY_ID?.trim();
  if (strategyId !== undefined && strategyId !== "") {
    bodyParams.append("strategyId", String(strategyId));
  }

  if (options?.userId) {
    bodyParams.append("userId", options.userId);
  }

  if (options?.userIp) {
    bodyParams.append("userIp", options.userIp);
  }

  const requestBody = bodyParams.toString();
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: requestBody,
      });

      const data = await res.json();

      // 若触发瞬时 QPS 峰值限制 (error_code: 18)，退避重试
      if (data.error_code === 18 && attempt < maxRetries) {
        await sleep(600 * (attempt + 1));
        continue;
      }

      // 百度图片审核结果码说明:
      // conclusionType: 1=合规, 2=不合规, 3=疑似, 4=审核失败
      if (data.conclusionType === 1 || data.conclusion === "合规") {
        return {
          imageUrl,
          isSafe: true,
          isSensitive: false,
          isDangerous: false,
          isDegraded: false,
          score: 100,
          violationReason: "百度AI图片审核合规",
          baiduLogId: data.log_id,
          details: data,
          hasBaiduConfigured: true,
        };
      }

      if (data.conclusionType === 2 || data.conclusion === "不合规") {
        const parsed = parseBaiduDataDetails(data.data || []);
        const reason = `图片包含违规内容：${parsed.summaryText || "命中平台内容安全禁令"}`;

        return {
          imageUrl,
          isSafe: false,
          isSensitive: false,
          isDangerous: true,
          isDegraded: false,
          score: 20,
          violationReason: reason,
          violations: parsed.violations,
          matchedWords: parsed.matchedWords,
          baiduLogId: data.log_id,
          details: data,
          hasBaiduConfigured: true,
        };
      }

      if (data.conclusionType === 3 || data.conclusion === "疑似") {
        const parsed = parseBaiduDataDetails(data.data || []);
        const reason = `图片疑似存在合规风险：${parsed.summaryText || "疑似敏感要素"}，转入人工审核`;

        return {
          imageUrl,
          isSafe: false,
          isSensitive: true,
          isDangerous: false,
          isDegraded: false,
          score: 60,
          violationReason: reason,
          violations: parsed.violations,
          matchedWords: parsed.matchedWords,
          baiduLogId: data.log_id,
          details: data,
          hasBaiduConfigured: true,
        };
      }

      if (data.conclusionType === 4 || data.conclusion === "审核失败") {
        const failDesc = (data.data || [])
          .map((d: any) => d.msg || d.error_msg)
          .filter(Boolean)
          .join("、");
        return {
          imageUrl,
          isSafe: true,
          isSensitive: false,
          isDangerous: false,
          isDegraded: true,
          score: 100,
          violationReason: `百度图像审核失败(${failDesc || "图像尺寸或格式不满足要求"})，已降级放行`,
          baiduLogId: data.log_id,
          details: data,
          hasBaiduConfigured: true,
        };
      }

      // 百度接口错误处理（如 QPS 超限、图片尺寸异常 <50px / >6000px 等）
      if (data.error_code) {
        console.warn(
          `[ImageModerator] 百度图片审核返回错误 (code: ${data.error_code}, msg: ${data.error_msg})，自动降级放行`
        );
        return {
          imageUrl,
          isSafe: true,
          isSensitive: false,
          isDangerous: false,
          isDegraded: true,
          score: 100,
          violationReason: `百度接口返回错误(${data.error_code}: ${data.error_msg})，已降级放行`,
          baiduLogId: data.log_id,
          details: data,
          hasBaiduConfigured: true,
        };
      }

      return {
        imageUrl,
        isSafe: true,
        isSensitive: false,
        isDangerous: false,
        isDegraded: false,
        score: 100,
        violationReason: "审核完成（默认为合规）",
        baiduLogId: data.log_id,
        details: data,
        hasBaiduConfigured: true,
      };
    } catch (err) {
      if (attempt < maxRetries) {
        await sleep(500 * (attempt + 1));
        continue;
      }
      console.error(`[ImageModerator] 审核图片失败:`, err);
      return {
        imageUrl,
        isSafe: true,
        isSensitive: false,
        isDangerous: false,
        isDegraded: true,
        score: 100,
        violationReason: "网络异常或审核超时，降级放行",
        hasBaiduConfigured: true,
      };
    }
  }

  return {
    imageUrl,
    isSafe: true,
    isSensitive: false,
    isDangerous: false,
    isDegraded: true,
    score: 100,
    violationReason: "图像审核重试超限，降级放行",
    hasBaiduConfigured: true,
  };
}

/**
 * 审核单张图片 (通过 URL)
 */
export async function auditSingleImage(
  imageUrl: string,
  accessToken: string,
  options?: BaiduImageAuditOptions
): Promise<ImageAuditItemResult> {
  return auditSingleImageSource({ imageUrl }, accessToken, options);
}

/**
 * 审核单张图片 (通过 Base64)
 */
export async function auditSingleImageBase64(
  imageBase64: string,
  accessToken?: string | null,
  options?: BaiduImageAuditOptions
): Promise<ImageAuditItemResult> {
  return auditSingleImageSource({ imageBase64 }, accessToken, options);
}

/**
 * 批量审核文章中包含的所有图片（分批限流并发）
 */
export async function auditPostImages(
  imageUrls: string[],
  options?: BaiduImageAuditOptions
): Promise<ImageAuditOverallResult> {
  if (!imageUrls || imageUrls.length === 0) {
    return {
      hasImages: false,
      imageCount: 0,
      isAllSafe: true,
      hasDangerous: false,
      hasSensitive: false,
      hasDegraded: false,
      degradedReasons: [],
      matchedWords: [],
      reasons: [],
      itemResults: [],
    };
  }

  const accessToken = await getBaiduAccessToken();

  // 若未配置百度图像审核 Key，记录日志并优雅降级为安全
  if (!accessToken) {
    return {
      hasImages: true,
      imageCount: imageUrls.length,
      isAllSafe: true,
      hasDangerous: false,
      hasSensitive: false,
      hasDegraded: true,
      degradedReasons: ["未配置百度审核密钥（降级放行）"],
      matchedWords: [],
      reasons: [],
      itemResults: imageUrls.map((url) => ({
        imageUrl: url,
        isSafe: true,
        isSensitive: false,
        isDangerous: false,
        isDegraded: true,
        score: 0,
      })),
    };
  }

  // 最多抽检前 5 张图片，每批最多 2 张并发
  const targetUrls = imageUrls.slice(0, 5);
  const batchSize = 2;
  const itemResults: ImageAuditItemResult[] = [];

  for (let i = 0; i < targetUrls.length; i += batchSize) {
    if (i > 0) {
      await sleep(350);
    }
    const batch = targetUrls.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((url) => auditSingleImage(url, accessToken, options))
    );
    itemResults.push(...batchResults);
  }

  const dangerousItems = itemResults.filter((r) => r.isDangerous);
  const sensitiveItems = itemResults.filter((r) => r.isSensitive);
  const degradedItems = itemResults.filter((r) => r.isDegraded);

  const reasons = [
    ...dangerousItems.map((d) => d.violationReason || "插图存在违规内容"),
    ...sensitiveItems.map((s) => s.violationReason || "插图疑似敏感"),
  ];

  const degradedReasons = degradedItems.map(
    (item) => item.violationReason || "图像审核降级放行"
  );

  const matchedWords = Array.from(
    new Set(itemResults.flatMap((item) => item.matchedWords || []))
  );

  return {
    hasImages: true,
    imageCount: imageUrls.length,
    isAllSafe: dangerousItems.length === 0 && sensitiveItems.length === 0,
    hasDangerous: dangerousItems.length > 0,
    hasSensitive: sensitiveItems.length > 0,
    hasDegraded: degradedItems.length > 0,
    degradedReasons,
    matchedWords,
    reasons,
    itemResults,
  };
}
