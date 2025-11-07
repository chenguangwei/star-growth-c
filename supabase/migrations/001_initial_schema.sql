-- Supabase 数据库表结构
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 用户表（支持 Supabase Auth 和 NextAuth OAuth）
-- id 可以是 auth.users(id) 或 NextAuth user.id
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY, -- 支持 UUID (Supabase Auth) 和字符串 (NextAuth)
  email TEXT,
  name TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 孩子表
-- 注意：user_id 使用 TEXT 类型以支持 Supabase Auth (UUID) 和 NextAuth OAuth (字符串)
-- 不使用外键约束，通过 RLS 策略保证数据安全
CREATE TABLE IF NOT EXISTS public.children (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- 支持 UUID 和字符串 ID
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  total_stars INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 每日任务记录表
CREATE TABLE IF NOT EXISTS public.daily_task_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  tasks JSONB DEFAULT '{}'::jsonb,
  total_stars INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, date)
);

-- 4. 单元测验记录表
CREATE TABLE IF NOT EXISTS public.quiz_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  subject TEXT NOT NULL CHECK (subject IN ('语文', '数学', '英语')),
  grade INTEGER NOT NULL CHECK (grade IN (3, 4, 5)),
  reward_stars INTEGER DEFAULT 0,
  corrected BOOLEAN DEFAULT FALSE,
  previous_grade INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 奖励兑换记录表
CREATE TABLE IF NOT EXISTS public.reward_exchanges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  reward_id TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  stars_cost INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('used', 'pending')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 操作日志表
CREATE TABLE IF NOT EXISTS public.operation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  action TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stars_change INTEGER,
  reason TEXT,
  operator TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_children_user_id ON public.children(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_task_records_child_date ON public.daily_task_records(child_id, date);
CREATE INDEX IF NOT EXISTS idx_quiz_records_child_id ON public.quiz_records(child_id);
CREATE INDEX IF NOT EXISTS idx_reward_exchanges_child_id ON public.reward_exchanges(child_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_child_id ON public.operation_logs(child_id);

-- 启用 Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_task_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_logs ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能访问自己的数据
-- 注意：OAuth 用户需要通过 user_profiles 表来验证
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (
    auth.uid()::text = id OR 
    id IN (SELECT id::text FROM auth.users WHERE email = user_profiles.email)
  );

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (
    auth.uid()::text = id OR 
    id IN (SELECT id::text FROM auth.users WHERE email = user_profiles.email)
  );

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (
    auth.uid()::text = id OR 
    id IN (SELECT id::text FROM auth.users WHERE email = user_profiles.email)
  );

-- 注意：由于 user_id 现在是 TEXT，需要调整 RLS 策略
-- 对于 Supabase Auth 用户，auth.uid() 返回 UUID，需要转换为 TEXT
-- 对于 OAuth 用户，user_id 是字符串，需要通过 user_profiles 验证
-- 简化策略：直接比较 user_id（已转换为 TEXT）
CREATE POLICY "Users can view own children" ON public.children
  FOR SELECT USING (
    auth.uid()::text = user_id
  );

CREATE POLICY "Users can insert own children" ON public.children
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id
  );

CREATE POLICY "Users can update own children" ON public.children
  FOR UPDATE USING (
    auth.uid()::text = user_id
  );

CREATE POLICY "Users can delete own children" ON public.children
  FOR DELETE USING (
    auth.uid()::text = user_id
  );

CREATE POLICY "Users can view own daily task records" ON public.daily_task_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = daily_task_records.child_id
      AND children.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own daily task records" ON public.daily_task_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = daily_task_records.child_id
      AND children.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own daily task records" ON public.daily_task_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = daily_task_records.child_id
      AND children.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can view own quiz records" ON public.quiz_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = quiz_records.child_id
      AND children.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own quiz records" ON public.quiz_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = quiz_records.child_id
      AND children.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own quiz records" ON public.quiz_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = quiz_records.child_id
      AND children.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can view own reward exchanges" ON public.reward_exchanges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = reward_exchanges.child_id
      AND children.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own reward exchanges" ON public.reward_exchanges
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = reward_exchanges.child_id
      AND children.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can view own operation logs" ON public.operation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = operation_logs.child_id
      AND children.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own operation logs" ON public.operation_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = operation_logs.child_id
      AND children.user_id = auth.uid()::text
    )
  );

-- 创建触发器自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_task_records_updated_at BEFORE UPDATE ON public.daily_task_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_records_updated_at BEFORE UPDATE ON public.quiz_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reward_exchanges_updated_at BEFORE UPDATE ON public.reward_exchanges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

