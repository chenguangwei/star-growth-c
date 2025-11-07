# 问题修复说明

## 问题 1: 注册成功但登录失败

### 原因
1. Supabase 默认启用邮箱验证，注册后用户处于未验证状态
2. 注册后没有自动创建 `user_profiles` 记录
3. 登录时可能因为用户未验证而失败

### 解决方案
1. ✅ 在注册时自动创建 `user_profiles` 记录
2. ✅ 在登录时检查并创建缺失的用户资料
3. ✅ 添加了错误处理和用户提示

### 重要配置
**必须在 Supabase Dashboard 中禁用邮箱验证（开发环境）：**
1. 进入 **Authentication** > **Settings**
2. 找到 **Email Auth** 部分
3. **取消勾选** "Enable email confirmations"

或者保持启用，但用户需要：
- 检查邮箱并点击验证链接
- 验证后才能登录

## 问题 2: 添加 OAuth 快捷登录

### 已添加
- ✅ Google OAuth 登录
- ✅ GitHub OAuth 登录
- ✅ 在登录页面显示 OAuth 按钮（仅在登录模式，注册模式不显示）

### 配置步骤

#### Google OAuth
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目并启用 Google+ API
3. 创建 OAuth 2.0 客户端 ID
4. 添加重定向 URI: `http://localhost:3000/api/auth/callback/google`
5. 复制 Client ID 和 Secret 到 `.env.local`

#### GitHub OAuth
1. GitHub Settings > Developer settings > OAuth Apps
2. 创建 OAuth App
3. 设置回调 URL: `http://localhost:3000/api/auth/callback/github`
4. 复制 Client ID 和 Secret 到 `.env.local`

### 注意事项
- OAuth 登录使用 NextAuth.js 处理
- 登录后会自动在 Supabase `user_profiles` 表中创建/更新用户资料
- OAuth 用户和邮箱密码用户使用相同的用户资料表

## 测试步骤

1. **测试邮箱注册**：
   - 访问 `/auth/signin`
   - 点击"没有账号？立即注册"
   - 输入邮箱和密码（至少6位）
   - 注册后应该自动登录

2. **测试邮箱登录**：
   - 使用注册的邮箱和密码登录
   - 应该能成功登录

3. **测试 OAuth 登录**（需要先配置）：
   - 点击 Google 或 GitHub 按钮
   - 完成 OAuth 授权
   - 应该能成功登录

4. **检查数据库**：
   - 在 Supabase Dashboard 中查看 `auth.users` 表（应该有用户记录）
   - 查看 `user_profiles` 表（应该有对应的用户资料）

## 如果仍然有问题

1. **检查 Supabase 邮箱验证设置**：确保已禁用邮箱验证
2. **检查环境变量**：确保所有 Supabase 和 NextAuth 变量都已设置
3. **检查数据库表**：确保已执行迁移脚本创建所有表
4. **查看浏览器控制台**：查看是否有错误信息
5. **查看 Supabase 日志**：在 Dashboard 中查看 Authentication 日志

