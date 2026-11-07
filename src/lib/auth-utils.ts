/**
 * 用户名注册与登录辅助工具
 * 保证中英文用户名均能生成清爽、直观且符合 RFC 标准的虚拟邮箱
 */

// 常用汉字拼音首字母/简易转写映射表（涵盖常见字符）
const PINYIN_MAP: Record<string, string> = {
    "测": "ce", "试": "shi", "账": "zhang", "号": "hao", "用": "yong", "户": "hu",
    "管": "guan", "理": "li", "员": "yuan", "学": "xue", "者": "zhe", "教": "jiao",
    "授": "shou", "研": "yan", "究": "jiu", "生": "sheng", "博": "bo", "士": "shi",
    "中": "zhong", "国": "guo", "华": "hua", "大": "da", "小": "xiao", "明": "ming",
    "红": "hong", "军": "jun", "强": "qiang", "伟": "wei", "刚": "gang", "勇": "yong",
    "峰": "feng", "超": "chao", "波": "bo", "涛": "tao", "鹏": "peng", "飞": "fei",
    "龙": "long", "亮": "liang", "文": "wen", "武": "wu", "金": "jin", "木": "mu",
    "水": "shui", "火": "huo", "土": "tu", "天": "tian", "地": "di", "人": "ren",
};

/**
 * 将中文字符串转换为简要拼音/安全 ASCII 标识
 */
function transcodeChineseToCleanAscii(str: string): string {
    let result = "";
    for (const char of str) {
        if (/[a-zA-Z0-9_.-]/.test(char)) {
            result += char.toLowerCase();
        } else if (PINYIN_MAP[char]) {
            result += PINYIN_MAP[char];
        } else {
            // 未知汉字或 Unicode 字符，使用字符的 Unicode 码点后 4 位，保持简短
            const code = char.charCodeAt(0).toString(16);
            result += code.slice(-2);
        }
    }
    return result.replace(/[^a-z0-9_.-]/g, "").slice(0, 24);
}

/**
 * 生成规范、清爽的虚拟邮箱
 * 示例：
 * - "hansszh" -> "hansszh@scholarly.org"
 * - "ceshi1" -> "ceshi1@scholarly.org"
 * - "11111" -> "11111@scholarly.org"
 * - "测试账号1" -> "ceshizhanghao1@scholarly.org"
 */
export function getUsernamePseudoEmail(username: string): string {
    const clean = (username || "").trim().toLowerCase();
    
    // 1. 如果是纯 ASCII 字母、数字、下划线、短横线，直接作为邮箱前缀（最干净）
    if (/^[a-z0-9_.-]+$/.test(clean)) {
        return `${clean}@scholarly.org`;
    }

    // 2. 包含中文等非 ASCII 字符时，转为干净的拼音/简短 ASCII 组合
    let asciiPrefix = transcodeChineseToCleanAscii(clean);
    if (!asciiPrefix || asciiPrefix.length < 2) {
        asciiPrefix = `scholar_${Math.random().toString(36).substring(2, 7)}`;
    }

    return `${asciiPrefix}@scholarly.org`;
}

/**
 * 将 Supabase Auth 返回的常见英文错误信息统一映射为规范中文提示
 */
export function translateSupabaseAuthError(
    message?: string | null,
    fallback = "认证服务暂时繁忙，请稍后重试"
): string {
    if (!message) return fallback;
    const raw = message.trim();
    const lower = raw.toLowerCase();

    // 若已是包含中文的提示则直接保留
    if (/[\u4e00-\u9fa5]/.test(raw)) {
        return raw;
    }

    if (
        lower.includes("already registered") ||
        lower.includes("already been registered") ||
        lower.includes("user already exists")
    ) {
        return "该账号或邮箱已被注册，请直接登录或更换后重试";
    }

    if (
        lower.includes("database error creating new user") ||
        lower.includes("database error saving new user")
    ) {
        return "创建新用户档案时发生数据库异常，请稍后重试";
    }

    if (lower.includes("invalid login credentials")) {
        return "账号或密码错误，请检查后重试";
    }

    if (lower.includes("email not confirmed")) {
        return "您的邮箱尚未完成验证，请先前往邮箱点击验证链接";
    }

    if (
        lower.includes("rate limit") ||
        lower.includes("too many requests") ||
        lower.includes("for security purposes, you can only request this")
    ) {
        return "操作请求过于频繁，请稍后再试";
    }

    if (lower.includes("password should be at least")) {
        return "密码长度不符合安全要求，请设置至少 6 位字符";
    }

    if (
        lower.includes("unable to validate email address") ||
        lower.includes("invalid email")
    ) {
        return "邮箱地址格式无效，请检查后重新输入";
    }

    if (lower.includes("error sending confirmation email")) {
        return "验证邮件发送失败，请稍后重试或切换为用户名注册";
    }

    if (lower.includes("signups not allowed")) {
        return "当前系统暂未开放自助注册";
    }

    return fallback;
}
