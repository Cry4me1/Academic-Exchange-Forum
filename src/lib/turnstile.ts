import crypto from "crypto";

const TURNSTILE_VERIFY_ENDPOINT =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Cloudflare 官方规范：Turnstile Token 最大长度为 2048 字符
const MAX_TURNSTILE_TOKEN_LENGTH = 2048;

export type TurnstileErrorCode =
  | "missing-input-secret"
  | "invalid-input-secret"
  | "missing-input-response"
  | "invalid-input-response"
  | "bad-request"
  | "timeout-or-duplicate"
  | "internal-error"
  | string;

interface TurnstileSiteverifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: TurnstileErrorCode[];
  action?: string;
  cdata?: string;
}

export interface TurnstileVerifyResult {
  success: boolean;
  message?: string;
  errorCodes?: TurnstileErrorCode[];
}

function resolveSecretKey(): string | null {
  const configured =
    process.env.TURNSTILE_SECRET?.trim() ||
    process.env.TURNSTILE_SECRET_KEY?.trim();
  if (configured) {
    return configured;
  }
  return null;
}

function mapTurnstileErrorMessage(codes?: TurnstileErrorCode[]): string {
  if (!codes || codes.length === 0) {
    return "人机安全验证未通过，请重试";
  }

  const primary = codes[0];
  switch (primary) {
    case "missing-input-response":
      return "请先完成人机安全验证";
    case "invalid-input-response":
      return "人机验证凭证无效，请刷新重试";
    case "timeout-or-duplicate":
      return "人机验证已过期或已被使用，请重新验证";
    case "bad-request":
      return "人机验证请求格式异常，请刷新页面重试";
    case "missing-input-secret":
    case "invalid-input-secret":
      return "服务端人机验证密钥配置异常，请联系管理员";
    case "internal-error":
      return "安全验证服务暂时繁忙，请稍后重试";
    default:
      return "人机安全验证未通过，请点击重试";
  }
}

/**
 * 服务端校验前端提交的 Cloudflare Turnstile Token
 * 遵循 Cloudflare Canonical Server-Side siteverify 规范
 */
export async function verifyTurnstileToken(
  token?: string | null,
  remoteIp?: string | null,
  expectedAction?: string
): Promise<TurnstileVerifyResult> {
  if (!token || typeof token !== "string" || !token.trim()) {
    return {
      success: false,
      message: "请先完成人机安全验证",
    };
  }

  const cleanToken = token.trim();
  if (cleanToken.length > MAX_TURNSTILE_TOKEN_LENGTH) {
    return {
      success: false,
      message: "人机验证凭证长度异常，请刷新重试",
    };
  }

  const secretKey = resolveSecretKey();
  if (!secretKey) {
    console.error(
      "[Turnstile] 缺失环境变量 TURNSTILE_SECRET / TURNSTILE_SECRET_KEY，拒绝放行请求。"
    );
    return {
      success: false,
      message: "人机安全验证服务未配置，请联系站点管理员",
    };
  }

  // 使用 application/x-www-form-urlencoded 标准请求体
  const body = new URLSearchParams();
  body.append("secret", secretKey);
  body.append("response", cleanToken);
  body.append("idempotency_key", crypto.randomUUID());

  if (remoteIp && remoteIp !== "unknown") {
    body.append("remoteip", remoteIp);
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body,
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `[Turnstile] Siteverify HTTP 异常状态码: ${response.status}`
      );
      return {
        success: false,
        message: "人机安全验证服务响应异常，请稍后重试",
      };
    }

    const data = (await response.json()) as TurnstileSiteverifyResponse;

    if (!data.success) {
      const errorCodes = data["error-codes"] ?? [];
      return {
        success: false,
        errorCodes,
        message: mapTurnstileErrorMessage(errorCodes),
      };
    }

    // 若配置了 TURNSTILE_HOSTNAMES，验证返回的 hostname 是否在白名单中
    const hostnamesConfig = process.env.TURNSTILE_HOSTNAMES?.trim();
    if (hostnamesConfig && data.hostname) {
      const allowedHostnames = new Set(
        hostnamesConfig
          .split(",")
          .map((h) => h.trim().toLowerCase())
          .filter(Boolean)
      );
      if (
        allowedHostnames.size > 0 &&
        !allowedHostnames.has(data.hostname.toLowerCase())
      ) {
        console.warn(
          `[Turnstile] Hostname 不匹配: 实际 "${data.hostname}", 允许列表: ${Array.from(allowedHostnames).join(", ")}`
        );
        return {
          success: false,
          message: "安全验证域名来源异常，请联系管理员",
        };
      }
    }

    // 若指定了业务场景 Action，且 Cloudflare 返回了非空 action，则校验一致性防跨端点挪用
    if (expectedAction && data.action && data.action !== expectedAction) {
      console.warn(
        `[Turnstile] Action 不匹配: 期望 "${expectedAction}"，实际 "${data.action}"`
      );
      return {
        success: false,
        message: "安全验证场景不匹配，请刷新页面后重试",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[Turnstile] 请求 Cloudflare Siteverify 接口异常:", error);
    return {
      success: false,
      message: "安全验证网络连接超时，请稍后重试",
    };
  }
}
