# 重要修复说明

## 问题修复

### 1. 注册后登录失败问题

**已修复**：
- ✅ 注册时自动创建 `user_profiles` 记录
- ✅ 登录时检查并创建缺失的用户资料
- ✅ 添加了更好的错误处理和用户提示

**重要配置**：
必须在 Supabase Dashboard 中**禁用邮箱验证**（开发环境）：
1. 进入 **Authentication** > **Settings**
2. 找到 **Email Auth** 部分
3. **取消勾选** "Enable email confirmations"

如果不禁用，用户需要：
- 检查邮箱并点击验证链接
- 验证后才能登录

### 2. OAuth 快捷登录

**已添加**：
- ✅ Google OAuth 登录按钮
- ✅ GitHub OAuth 登录按钮
- ✅ 在登录页面显示（注册模式不显示）

**数据库结构更新**：
- `user_profiles.id` 改为 `TEXT` 类型，支持 UUID（Supabase Auth）和字符串（NextAuth OAuth）
- `children.user_id` 改为 `TEXT` 类型，支持两种 ID 格式
- 更新了 RLS 策略以支持两种用户类型

**配置 OAuth**（可选）：
1. 按照 `ENV_SETUP.md` 配置 Google/GitHub OAuth
2. 添加环境变量到 `.env.local`
3. OAuth 登录会自动创建用户资料

## 测试步骤

1. **禁用 Supabase 邮箱验证**（必须）
2. **重新执行数据库迁移**（如果已执行过，需要更新表结构）
3. **测试注册**：应该能注册并自动登录
4. **测试登录**：使用注册的邮箱密码登录
5. **测试 OAuth**（如果已配置）：点击 Google/GitHub 按钮登录

## 数据库迁移更新

如果之前已经执行过迁移脚本，需要执行以下 SQL 来更新表结构：

```sql
-- 更新 user_profiles 表
ALTER TABLE public.user_profiles 
  ALTER COLUMN id TYPE TEXT;

-- 更新 children 表
ALTER TABLE public.children 
  ALTER COLUMN user_id TYPE TEXT;

-- 删除旧的 RLS 策略（如果存在）
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own children" ON public.children;
DROP POLICY IF EXISTS "Users can insert own children" ON public.children;
DROP POLICY IF EXISTS "Users can update own children" ON public.children;
DROP POLICY IF EXISTS "Users can delete own children" ON public.children;

-- 重新创建 RLS 策略（见迁移脚本中的新策略）
```

## 如果仍有问题

1. 检查 Supabase 邮箱验证是否已禁用
2. 检查环境变量是否正确设置
3. 检查数据库表结构是否已更新
4. 查看浏览器控制台和 Supabase 日志
5. 参考 `TROUBLESHOOTING.md` 获取更多帮助

