# 环境变量配置

在项目根目录创建 `.env.local` 文件，添加以下环境变量：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

sb_secret_pDlzwD3-xen8c_lIHWyRuA_v0fUUugw

# NextAuth.js 配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key

# OAuth 提供者（可选）
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# 生产环境
# NEXTAUTH_URL=https://your-domain.com
```

## 获取 Supabase 配置

1. 访问 [Supabase](https://supabase.com) 并创建项目
2. 在项目设置中找到 API 密钥：
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: service_role key (保密，仅用于服务端)

## 生成 NextAuth Secret

运行以下命令生成随机密钥：

```bash
openssl rand -base64 32
```

## Supabase 邮箱验证设置

为了允许注册后立即登录（开发环境），需要在 Supabase Dashboard 中：

1. 进入 **Authentication** > **Settings**
2. 找到 **Email Auth** 部分
3. **取消勾选** "Enable email confirmations"（开发环境）
4. 或者保持启用，但用户需要验证邮箱后才能登录

## 数据库设置

1. 在 Supabase Dashboard 中打开 SQL Editor
2. 执行 `supabase/migrations/001_initial_schema.sql` 中的 SQL 脚本
3. 这将创建所有必需的表和 RLS 策略

## OAuth 提供者配置（可选）

### Google OAuth

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 客户端 ID
5. 添加授权重定向 URI: `http://localhost:3000/api/auth/callback/google`
6. 复制 Client ID 和 Client Secret 到环境变量

### GitHub OAuth

1. 访问 GitHub Settings > Developer settings > OAuth Apps
2. 创建新的 OAuth App
3. 设置 Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. 复制 Client ID 和 Client Secret 到环境变量

## 部署说明

在 Vercel 或其他平台部署时，记得在环境变量中设置上述所有变量。

