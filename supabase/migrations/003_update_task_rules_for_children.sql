-- 修改任务规则表，将规则关联到孩子而不是用户

-- 删除旧的表（如果存在）
DROP TABLE IF EXISTS public.task_rules CASCADE;

-- 重新创建任务规则表（每个孩子可以有自己的一套规则）
CREATE TABLE IF NOT EXISTS public.task_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE, -- 关联到孩子
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
  UNIQUE(child_id, rule_id) -- 每个孩子的每个规则ID只能有一条记录
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_task_rules_child_id ON public.task_rules(child_id);
CREATE INDEX IF NOT EXISTS idx_task_rules_child_enabled ON public.task_rules(child_id, enabled);

-- 启用 RLS
ALTER TABLE public.task_rules ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能访问自己孩子的规则
CREATE POLICY "Users can view own children task rules" ON public.task_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = task_rules.child_id
      AND children.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own children task rules" ON public.task_rules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = task_rules.child_id
      AND children.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own children task rules" ON public.task_rules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = task_rules.child_id
      AND children.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own children task rules" ON public.task_rules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = task_rules.child_id
      AND children.user_id = auth.uid()::text
    )
  );

-- 创建触发器自动更新 updated_at
CREATE TRIGGER update_task_rules_updated_at BEFORE UPDATE ON public.task_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

