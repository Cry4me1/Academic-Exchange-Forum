/**
 * 图像内容安全审核服务 (基于百度 AI 开放平台图像审核 API)
 * 文档参考: https://www.free-api.com/doc/31
 */

interface BaiduTokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: BaiduTokenCache | null = null;

/**
 * 获取百度开放平台 Access Token
 */
export async function getBaiduAccessToken(): Promise<string | null> {
  const apiKey = process.env.BAIDU_IMAGE_CENSOR_API_KEY;
  const secretKey = process.env.BAIDU_IMAGE_CENSOR_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return null;
  }

  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60 * 1000) {
    return tokenCache.accessToken;
  }

  try {
    const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;
    const res = await fetch(url, { method: "POST" });
    const data = await res.json();

    if (data.access_token) {
      tokenCache = {
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
  score: number;
  violationReason?: string;
  details?: Record<string, any>;
  hasBaiduConfigured?: boolean;
}

export interface ImageAuditOverallResult {
  hasImages: boolean;
  imageCount: number;
  isAllSafe: boolean;
  hasDangerous: boolean;
  hasSensitive: boolean;
  reasons: string[];
  itemResults: ImageAuditItemResult[];
}

/**
 * 审核单张图片源（支持 URL 或 Base64）
 */
export async function auditSingleImageSource(
  source: { imageUrl?: string; imageBase64?: string },
  token?: string | null
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
      score: 100,
      violationReason: "未配置百度审核密钥（降级放行）",
      hasBaiduConfigured: false,
    };
  }

  try {
    const apiUrl = `https://aip.baidubce.com/rest/2.0/solution/v1/img_censor/v2/user_defined?access_token=${accessToken}`;

    const bodyParams = new URLSearchParams();
    if (imageBase64) {
      // 百度要求去除 data:image/xxx;base64, 前缀
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      bodyParams.append("image", cleanBase64);
    } else if (imageUrl) {
      bodyParams.append("imgUrl", imageUrl);
    } else {
      throw new Error("未提供有效的图片 URL 或 Base64 数据");
    }

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyParams.toString(),
    });

    const data = await res.json();

    // 百度图片审核结果码说明:
    // conclusion: 1=合规, 2=不合规, 3=疑似, 4=审核失败
    // data: 具体不合规的违规类型 (11=暴恐, 12=色情, 13=政治敏感, 14=低俗违禁等)
    if (data.conclusionType === 1 || data.conclusion === "合规") {
      return {
        imageUrl,
        isSafe: true,
        isSensitive: false,
        isDangerous: false,
        score: 100,
        violationReason: "百度AI图片审核合规",
        details: data,
        hasBaiduConfigured: true,
      };
    }

    if (data.conclusionType === 2 || data.conclusion === "不合规") {
      const typeDesc = (data.data || [])
        .map((d: any) => d.msg || d.type)
        .filter(Boolean)
        .join("、");
      const reason = `图片包含违规内容（${typeDesc || "涉嫌色情/暴恐/政治敏感/违规"}）`;

      return {
        imageUrl,
        isSafe: false,
        isSensitive: false,
        isDangerous: true,
        score: 20,
        violationReason: reason,
        details: data,
        hasBaiduConfigured: true,
      };
    }

    if (data.conclusionType === 3 || data.conclusion === "疑似") {
      const typeDesc = (data.data || [])
        .map((d: any) => d.msg || d.type)
        .filter(Boolean)
        .join("、");
      const reason = `图片疑似存在违规风险（${typeDesc || "疑似敏感"}），转入审核`;

      return {
        imageUrl,
        isSafe: false,
        isSensitive: true,
        isDangerous: false,
        score: 60,
        violationReason: reason,
        details: data,
        hasBaiduConfigured: true,
      };
    }

    // 百度接口错误处理（如 QPS 超限、图片格式不合法等）
    if (data.error_code) {
      console.warn(
        `[ImageModerator] 百度图片审核返回错误 (code: ${data.error_code}, msg: ${data.error_msg})，自动降级放行`
      );
      return {
        imageUrl,
        isSafe: true,
        isSensitive: false,
        isDangerous: false,
        score: 100,
        violationReason: `百度接口返回错误(${data.error_code}: ${data.error_msg})，已降级放行`,
        details: data,
        hasBaiduConfigured: true,
      };
    }

    return {
      imageUrl,
      isSafe: true,
      isSensitive: false,
      isDangerous: false,
      score: 100,
      violationReason: "审核完成（默认为合规）",
      details: data,
      hasBaiduConfigured: true,
    };
  } catch (err) {
    console.error(`[ImageModerator] 审核图片失败:`, err);
    return {
      imageUrl,
      isSafe: true,
      isSensitive: false,
      isDangerous: false,
      score: 100,
      violationReason: "网络异常或审核超时，降级放行",
      hasBaiduConfigured: true,
    };
  }
}

/**
 * 审核单张图片 (通过 URL)
 */
export async function auditSingleImage(
  imageUrl: string,
  accessToken: string
): Promise<ImageAuditItemResult> {
  return auditSingleImageSource({ imageUrl }, accessToken);
}

/**
 * 审核单张图片 (通过 Base64)
 */
export async function auditSingleImageBase64(
  imageBase64: string,
  accessToken?: string | null
): Promise<ImageAuditItemResult> {
  return auditSingleImageSource({ imageBase64 }, accessToken);
}

/**
 * 批量审核文章中包含的所有图片
 */
export async function auditPostImages(
  imageUrls: string[]
): Promise<ImageAuditOverallResult> {
  if (!imageUrls || imageUrls.length === 0) {
    return {
      hasImages: false,
      imageCount: 0,
      isAllSafe: true,
      hasDangerous: false,
      hasSensitive: false,
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
      reasons: [],
      itemResults: imageUrls.map((url) => ({
        imageUrl: url,
        isSafe: true,
        isSensitive: false,
        isDangerous: false,
        score: 0,
      })),
    };
  }

  // 并发审核最多 5 张图片，避免超时
  const targetUrls = imageUrls.slice(0, 5);
  const itemResults = await Promise.all(
    targetUrls.map((url) => auditSingleImage(url, accessToken))
  );

  const dangerousItems = itemResults.filter((r) => r.isDangerous);
  const sensitiveItems = itemResults.filter((r) => r.isSensitive);

  const reasons = [
    ...dangerousItems.map((d) => d.violationReason || "插图存在违规内容"),
    ...sensitiveItems.map((s) => s.violationReason || "插图疑似敏感"),
  ];

  return {
    hasImages: true,
    imageCount: imageUrls.length,
    isAllSafe: dangerousItems.length === 0 && sensitiveItems.length === 0,
    hasDangerous: dangerousItems.length > 0,
    hasSensitive: sensitiveItems.length > 0,
    reasons,
    itemResults,
  };
}
