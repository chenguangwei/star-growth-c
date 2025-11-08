-- 添加任务规则表，允许用户自定义摘星星规则

-- 任务规则表（每个用户可以有自己的一套规则）
CREATE TABLE IF NOT EXISTS public.task_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- 用户ID（支持 Supabase Auth 和 NextAuth）
  rule_id TEXT NOT NULL, -- 规则ID（用于标识规则，如 "on-time-start"）
  name TEXT NOT NULL, -- 规则名称
  description TEXT NOT NULL, -- 规则描述
  base_stars INTEGER NOT NULL DEFAULT 1, -- 基础星星数
  max_count INTEGER, -- 最大完成次数（用于 countable 类型）
  type TEXT NOT NULL CHECK (type IN ('simple', 'countable', 'input')), -- 规则类型
  input_config JSONB, -- 输入配置（JSON格式，包含字段定义和计算逻辑）
  enabled BOOLEAN DEFAULT TRUE, -- 是否启用
  display_order INTEGER DEFAULT 0, -- 显示顺序
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, rule_id) -- 每个用户的每个规则ID只能有一条记录
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_task_rules_user_id ON public.task_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_task_rules_user_enabled ON public.task_rules(user_id, enabled);

-- 启用 RLS
ALTER TABLE public.task_rules ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能访问自己的规则
CREATE POLICY "Users can view own task rules" ON public.task_rules
  FOR SELECT USING (
    auth.uid()::text = user_id
  );

CREATE POLICY "Users can insert own task rules" ON public.task_rules
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id
  );

CREATE POLICY "Users can update own task rules" ON public.task_rules
  FOR UPDATE USING (
    auth.uid()::text = user_id
  );

CREATE POLICY "Users can delete own task rules" ON public.task_rules
  FOR DELETE USING (
    auth.uid()::text = user_id
  );

-- 创建触发器自动更新 updated_at
CREATE TRIGGER update_task_rules_updated_at BEFORE UPDATE ON public.task_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

