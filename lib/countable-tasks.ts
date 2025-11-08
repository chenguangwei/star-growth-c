import type {
  DailyTaskItem,
  DailyTaskRule,
  CountableTaskDetail,
} from "@/types";

/**
 * 添加一次可计数任务完成记录
 */
export function addCountableTaskCompletion(
  item: DailyTaskItem | undefined,
  rule: DailyTaskRule,
  options?: {
    quality?: 1 | 2 | 3;
    reflection?: string;
    duration?: number;
  }
): DailyTaskItem {
  const currentCount = item?.count || 0;
  const maxCount = rule.maxCount || Infinity;
  
  // 检查是否超过上限
  if (currentCount >= maxCount) {
    return item || {
      taskId: rule.id,
      taskName: rule.name,
      completed: false,
      stars: 0,
      count: 0,
    };
  }
  
  const newCount = currentCount + 1;
  const baseStars = rule.baseStars;
  
  // 计算质量奖励
  let qualityStars = 0;
  if (options?.quality && rule.countableConfig?.qualityEnabled) {
    const qualityBonus = rule.countableConfig.qualityBonus || [0, 0, 0];
    qualityStars = qualityBonus[options.quality - 1] || 0;
  }
  
  // 创建详细记录
  const detail: CountableTaskDetail = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    quality: options?.quality,
    qualityStars,
    reflection: options?.reflection,
    duration: options?.duration,
  };
  
  // 更新任务项
  const countDetails = item?.countDetails || [];
  countDetails.push(detail);
  
  const totalStars = newCount * baseStars + qualityStars;
  
  return {
    taskId: rule.id,
    taskName: rule.name,
    completed: newCount > 0,
    stars: totalStars,
    count: newCount,
    countDetails,
  };
}

/**
 * 移除一次可计数任务完成记录
 */
export function removeCountableTaskCompletion(
  item: DailyTaskItem,
  rule: DailyTaskRule
): DailyTaskItem {
  const currentCount = item.count || 0;
  if (currentCount <= 0) {
    return item;
  }
  
  const newCount = currentCount - 1;
  const baseStars = rule.baseStars;
  
  // 移除最后一次记录
  const countDetails = item.countDetails || [];
  countDetails.pop();
  
  // 重新计算总星星数（基础星星 + 剩余记录的质量奖励）
  const baseStarsTotal = newCount * baseStars;
  const qualityStarsTotal = countDetails.reduce(
    (sum, detail) => sum + (detail.qualityStars || 0),
    0
  );
  const totalStars = baseStarsTotal + qualityStarsTotal;
  
  return {
    ...item,
    count: newCount,
    completed: newCount > 0,
    stars: totalStars,
    countDetails,
  };
}

/**
 * 计算可计数任务的总星星数（包括质量奖励）
 */
export function calculateCountableTaskStars(
  item: DailyTaskItem | undefined,
  rule: DailyTaskRule
): number {
  if (!item || !item.completed) return 0;
  
  const baseStars = (item.count || 0) * rule.baseStars;
  
  // 计算质量奖励总和
  const qualityStars = (item.countDetails || []).reduce(
    (sum, detail) => sum + (detail.qualityStars || 0),
    0
  );
  
  return baseStars + qualityStars;
}

