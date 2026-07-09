export const AUTH_ERROR_COPY = {
  rateLimited: "请求过于频繁，请稍后再试。",
  codeInvalid: "验证码不正确或已过期。",
  credentialsInvalid: "账号或密码不正确。",
  securityFailed: "安全验证失败，请稍后重试。",
  oauthFailed: "第三方登录失败，请稍后再试。",
  testAccountRetired:
    "测试账号已停用，请使用真实邮箱或 Google / 支付宝登录。"
} as const;
