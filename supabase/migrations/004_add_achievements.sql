-- 添加成就系统表

-- 成就记录表
CREATE TABLE IF NOT EXISTS public.achievement_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL, -- 成就ID（如 "focus-master-7"）
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0, -- 当前进度
  completed BOOLEAN DEFAULT FALSE, -- 是否已完成
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, achievement_id) -- 每个孩子的每个成就只能有一条记录
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_achievement_records_child_id ON public.achievement_records(child_id);
CREATE INDEX IF NOT EXISTS idx_achievement_records_child_completed ON public.achievement_records(child_id, completed);

-- 启用 RLS
ALTER TABLE public.achievement_records ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能访问自己孩子的成就记录
CREATE POLICY "Users can view own children achievement records" ON public.achievement_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = achievement_records.child_id
      AND children.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own children achievement records" ON public.achievement_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = achievement_records.child_id
      AND children.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own children achievement records" ON public.achievement_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = achievement_records.child_id
      AND children.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own children achievement records" ON public.achievement_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = achievement_records.child_id
      AND children.user_id = auth.uid()::text
    )
  );

-- 创建触发器自动更新 updated_at
CREATE TRIGGER update_achievement_records_updated_at BEFORE UPDATE ON public.achievement_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

