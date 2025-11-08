import { supabase } from "@/lib/supabase/client";
import type {
  Child,
  DailyTaskRecord,
  QuizRecord,
  RewardExchange,
  OperationLog,
  DailyTaskRule,
} from "@/types";

// ============ 孩子数据管理 ============

export async function getChildren(userId: string): Promise<Child[]> {
  if (!userId) {
    console.error("getChildren: userId 为空");
    return [];
  }

  console.log("getChildren: 查询用户ID:", userId);
  
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("user_id", userId) // user_id 现在是 TEXT 类型，支持 UUID 和字符串
    .order("created_at", { ascending: false });

  if (error) {
    console.error("获取孩子列表失败:", error);
    console.error("错误详情:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return [];
  }

  console.log("getChildren: 查询结果:", data);

  return (
    data?.map((child) => ({
      id: child.id,
      name: child.name,
      avatar: child.avatar,
      createdAt: child.created_at,
      totalStars: child.total_stars || 0,
    })) || []
  );
}

export async function getChildById(id: string): Promise<Child | null> {
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    avatar: data.avatar,
    createdAt: data.created_at,
    totalStars: data.total_stars || 0,
  };
}

export async function addChild(
  userId: string,
  child: Omit<Child, "id" | "createdAt" | "totalStars">
): Promise<Child> {
  const { data, error } = await supabase
    .from("children")
    .insert({
      user_id: userId, // 支持 UUID 和字符串 ID
      name: child.name,
      avatar: child.avatar,
      total_stars: 0,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || "添加孩子失败");
  }

  return {
    id: data.id,
    name: data.name,
    avatar: data.avatar,
    createdAt: data.created_at,
    totalStars: data.total_stars || 0,
  };
}

export async function updateChild(
  id: string,
  updates: Partial<Omit<Child, "id" | "createdAt">>
): Promise<Child | null> {
  const updateData: any = {};
  if (updates.name) updateData.name = updates.name;
  if (updates.avatar) updateData.avatar = updates.avatar;
  if (updates.totalStars !== undefined) updateData.total_stars = updates.totalStars;

  const { data, error } = await supabase
    .from("children")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    avatar: data.avatar,
    createdAt: data.created_at,
    totalStars: data.total_stars || 0,
  };
}

export async function deleteChild(id: string): Promise<boolean> {
  const { error } = await supabase.from("children").delete().eq("id", id);
  return !error;
}

export async function updateChildStars(id: string, delta: number): Promise<void> {
  const { data: child } = await supabase
    .from("children")
    .select("total_stars")
    .eq("id", id)
    .single();

  if (child) {
    await supabase
      .from("children")
      .update({ total_stars: Math.max(0, (child.total_stars || 0) + delta) })
      .eq("id", id);
  }
}

// ============ 每日任务数据管理 ============

export async function getDailyTaskRecord(
  childId: string,
  date: string
): Promise<DailyTaskRecord | null> {
  const { data, error } = await supabase
    .from("daily_task_records")
    .select("*")
    .eq("child_id", childId)
    .eq("date", date)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    childId: data.child_id,
    date: data.date,
    tasks: data.tasks || {},
    totalStars: data.total_stars || 0,
    notes: data.notes || undefined,
  };
}

export async function getAllDailyTaskRecords(
  childId: string
): Promise<DailyTaskRecord[]> {
  const { data, error } = await supabase
    .from("daily_task_records")
    .select("*")
    .eq("child_id", childId)
    .order("date", { ascending: false });

  if (error) {
    return [];
  }

  return (
    data?.map((record) => ({
      childId: record.child_id,
      date: record.date,
      tasks: record.tasks || {},
      totalStars: record.total_stars || 0,
      notes: record.notes || undefined,
    })) || []
  );
}

export async function saveDailyTaskRecord(
  record: DailyTaskRecord
): Promise<void> {
  const { data: existing } = await supabase
    .from("daily_task_records")
    .select("total_stars")
    .eq("child_id", record.childId)
    .eq("date", record.date)
    .single();

  let delta = record.totalStars;
  if (existing) {
    delta = record.totalStars - (existing.total_stars || 0);
  }

  const { error } = await supabase.from("daily_task_records").upsert({
    child_id: record.childId,
    date: record.date,
    tasks: record.tasks,
    total_stars: record.totalStars,
    notes: record.notes,
  });

  if (error) {
    console.error("保存每日任务记录失败:", error);
    return;
  }

  // 更新孩子的星星总数
  if (delta !== 0) {
    await updateChildStars(record.childId, delta);
  }
}

// ============ 单元测验数据管理 ============

export async function getQuizRecords(childId: string): Promise<QuizRecord[]> {
  const { data, error } = await supabase
    .from("quiz_records")
    .select("*")
    .eq("child_id", childId)
    .order("date", { ascending: false });

  if (error) {
    return [];
  }

  return (
    data?.map((record) => ({
      id: record.id,
      childId: record.child_id,
      date: record.date,
      subject: record.subject as "语文" | "数学" | "英语",
      grade: record.grade as 3 | 4 | 5,
      rewardStars: record.reward_stars || 0,
      corrected: record.corrected || false,
      previousGrade: record.previous_grade as 3 | 4 | 5 | undefined,
      notes: record.notes || undefined,
    })) || []
  );
}

export async function addQuizRecord(
  record: Omit<QuizRecord, "id">
): Promise<QuizRecord> {
  const { data, error } = await supabase
    .from("quiz_records")
    .insert({
      child_id: record.childId,
      date: record.date,
      subject: record.subject,
      grade: record.grade,
      reward_stars: record.rewardStars,
      corrected: record.corrected,
      previous_grade: record.previousGrade,
      notes: record.notes,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || "添加测验记录失败");
  }

  // 更新孩子的星星总数
  await updateChildStars(record.childId, record.rewardStars);

  return {
    id: data.id,
    childId: data.child_id,
    date: data.date,
    subject: data.subject as "语文" | "数学" | "英语",
    grade: data.grade as 3 | 4 | 5,
    rewardStars: data.reward_stars || 0,
    corrected: data.corrected || false,
    previousGrade: data.previous_grade as 3 | 4 | 5 | undefined,
    notes: data.notes || undefined,
  };
}

export async function updateQuizRecord(
  id: string,
  updates: Partial<QuizRecord>
): Promise<boolean> {
  const updateData: any = {};
  if (updates.corrected !== undefined) updateData.corrected = updates.corrected;
  if (updates.rewardStars !== undefined)
    updateData.reward_stars = updates.rewardStars;

  const { data: oldRecord, error: fetchError } = await supabase
    .from("quiz_records")
    .select("reward_stars, child_id")
    .eq("id", id)
    .single();

  if (fetchError || !oldRecord) {
    return false;
  }

  const { error } = await supabase
    .from("quiz_records")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return false;
  }

  // 如果修改了rewardStars，更新孩子的星星总数
  if (updates.rewardStars !== undefined) {
    const delta = updates.rewardStars - oldRecord.reward_stars;
    await updateChildStars(oldRecord.child_id, delta);
  }

  return true;
}

// ============ 兑换记录数据管理 ============

export async function getRewardExchanges(
  childId: string
): Promise<RewardExchange[]> {
  const { data, error } = await supabase
    .from("reward_exchanges")
    .select("*")
    .eq("child_id", childId)
    .order("date", { ascending: false });

  if (error) {
    return [];
  }

  return (
    data?.map((exchange) => ({
      id: exchange.id,
      childId: exchange.child_id,
      date: exchange.date,
      rewardId: exchange.reward_id,
      rewardName: exchange.reward_name,
      starsCost: exchange.stars_cost,
      status: exchange.status as "used" | "pending",
      notes: exchange.notes || undefined,
    })) || []
  );
}

export async function addRewardExchange(
  exchange: Omit<RewardExchange, "id" | "date">
): Promise<RewardExchange> {
  const { data, error } = await supabase
    .from("reward_exchanges")
    .insert({
      child_id: exchange.childId,
      date: new Date().toISOString().split("T")[0],
      reward_id: exchange.rewardId,
      reward_name: exchange.rewardName,
      stars_cost: exchange.starsCost,
      status: exchange.status,
      notes: exchange.notes,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || "添加兑换记录失败");
  }

  // 扣除孩子的星星
  await updateChildStars(exchange.childId, -exchange.starsCost);

  return {
    id: data.id,
    childId: data.child_id,
    date: data.date,
    rewardId: data.reward_id,
    rewardName: data.reward_name,
    starsCost: data.stars_cost,
    status: data.status as "used" | "pending",
    notes: data.notes || undefined,
  };
}

// ============ 操作日志管理 ============

export async function addOperationLog(
  log: Omit<OperationLog, "id">
): Promise<void> {
  await supabase.from("operation_logs").insert({
    child_id: log.childId,
    type: log.type,
    action: log.action,
    date: log.date,
    stars_change: log.starsChange,
    reason: log.reason,
    operator: log.operator,
  });
}

export async function getOperationLogs(
  childId?: string
): Promise<OperationLog[]> {
  let query = supabase.from("operation_logs").select("*");

  if (childId) {
    query = query.eq("child_id", childId);
  }

  const { data, error } = await query.order("date", { ascending: false });

  if (error) {
    return [];
  }

  return (
    data?.map((log) => ({
      id: log.id,
      childId: log.child_id,
      type: log.type,
      action: log.action,
      date: log.date,
      starsChange: log.stars_change,
      reason: log.reason,
      operator: log.operator,
    })) || []
  );
}

// ============ 任务规则管理 ============

// 获取孩子的自定义任务规则
export async function getTaskRules(childId: string): Promise<DailyTaskRule[]> {
  const { data, error } = await supabase
    .from("task_rules")
    .select("*")
    .eq("child_id", childId)
    .eq("enabled", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("获取任务规则失败:", error);
    return [];
  }

  return (
    data?.map((rule) => ({
      id: rule.rule_id,
      name: rule.name,
      description: rule.description,
      baseStars: rule.base_stars,
      maxCount: rule.max_count || undefined,
      type: rule.type as "simple" | "countable" | "input",
      inputConfig: rule.input_config
        ? {
            fields: rule.input_config.fields || [],
            // 注意：自定义规则暂时不支持复杂的 calculateStars 函数
            calculateStars: undefined,
          }
        : undefined,
    })) || []
  );
}

// 保存任务规则
export async function saveTaskRule(
  childId: string,
  rule: DailyTaskRule
): Promise<boolean> {
  // 将 calculateStars 函数转换为可存储的配置
  // 注意：自定义规则暂时不支持复杂的 inputConfig
  const inputConfig = rule.inputConfig
    ? {
        fields: rule.inputConfig.fields || [],
      }
    : null;

  const { error } = await supabase.from("task_rules").upsert({
    child_id: childId,
    rule_id: rule.id,
    name: rule.name,
    description: rule.description,
    base_stars: rule.baseStars,
    max_count: rule.maxCount || null,
    type: rule.type,
    input_config: inputConfig,
    enabled: true,
  });

  if (error) {
    console.error("保存任务规则失败:", error);
    return false;
  }

  return true;
}

// 删除任务规则
export async function deleteTaskRule(
  childId: string,
  ruleId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("task_rules")
    .delete()
    .eq("child_id", childId)
    .eq("rule_id", ruleId);

  if (error) {
    console.error("删除任务规则失败:", error);
    return false;
  }

  return true;
}

// 禁用/启用任务规则
export async function toggleTaskRule(
  childId: string,
  ruleId: string,
  enabled: boolean
): Promise<boolean> {
  const { error } = await supabase
    .from("task_rules")
    .update({ enabled })
    .eq("child_id", childId)
    .eq("rule_id", ruleId);

  if (error) {
    console.error("更新任务规则状态失败:", error);
    return false;
  }

  return true;
}

