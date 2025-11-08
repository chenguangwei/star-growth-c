-- 添加奖励表（每个孩子可以有自己的一套奖励）

-- 创建奖励表
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  reward_id TEXT NOT NULL, -- 奖励ID（用于标识奖励，如 "video-time" 或自定义ID）
  name TEXT NOT NULL, -- 奖励名称
  description TEXT, -- 奖励描述
  stars_cost INTEGER NOT NULL, -- 所需星星数
  category TEXT, -- 奖励分类（如 "娱乐", "购物"）
  enabled BOOLEAN DEFAULT TRUE, -- 是否启用
  display_order INTEGER DEFAULT 0, -- 显示顺序
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, reward_id) -- 每个孩子的每个奖励ID只能有一条记录
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_rewards_child_id ON public.rewards(child_id);
CREATE INDEX IF NOT EXISTS idx_rewards_child_enabled ON public.rewards(child_id, enabled);

-- 启用 RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能访问自己孩子的奖励
CREATE POLICY "Users can view own children rewards" ON public.rewards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = rewards.child_id
      AND children.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own children rewards" ON public.rewards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = rewards.child_id
      AND children.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own children rewards" ON public.rewards
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = rewards.child_id
      AND children.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own children rewards" ON public.rewards
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = rewards.child_id
      AND children.user_id = auth.uid()::text
    )
  );

-- 创建触发器自动更新 updated_at
CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

