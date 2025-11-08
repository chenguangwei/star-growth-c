import {
  getAllDailyTaskRecordsSync,
  getQuizRecordsSync,
  getRewardExchanges,
} from "@/lib/data";

/**
 * 计算孩子的总获得星星数（从所有记录中计算，总是从 Supabase 获取最新数据）
 */
export async function calculateTotalEarnedStars(childId: string): Promise<number> {
  try {
    // 总是从 Supabase 获取最新数据，确保准确性
    const { getAllDailyTaskRecords, getQuizRecords } = await import("@/lib/data");
    const dailyRecords = await getAllDailyTaskRecords(childId);
    const quizRecords = await getQuizRecords(childId);

    const dailyStars = dailyRecords.reduce(
      (sum, record) => sum + record.totalStars,
      0
    );
    const quizStars = quizRecords.reduce(
      (sum, record) => sum + record.rewardStars,
      0
    );

    return dailyStars + quizStars;
  } catch (error) {
    console.error("计算总获得星星失败，使用 localStorage 数据:", error);
    // 如果 Supabase 失败，回退到 localStorage（用于离线场景）
    const dailyRecords = getAllDailyTaskRecordsSync(childId);
    const quizRecords = getQuizRecordsSync(childId);
    const dailyStars = dailyRecords.reduce(
      (sum, record) => sum + record.totalStars,
      0
    );
    const quizStars = quizRecords.reduce(
      (sum, record) => sum + record.rewardStars,
      0
    );
    return dailyStars + quizStars;
  }
}

/**
 * 计算孩子的已兑换星星数（总是从 Supabase 获取最新数据）
 */
export async function calculateExchangedStars(childId: string): Promise<number> {
  try {
    // 总是从 Supabase 获取最新数据
    const response = await fetch(`/api/reward-exchanges?childId=${childId}`);
    if (response.ok) {
      const result = await response.json();
      const exchanges = result.exchanges || [];
      return exchanges.reduce((sum: number, exchange: any) => sum + exchange.starsCost, 0);
    }
  } catch (error) {
    console.error("获取兑换记录失败，使用 localStorage 数据:", error);
  }
  
  // 如果 Supabase 失败，回退到 localStorage（用于离线场景）
  const exchanges = getRewardExchanges(childId);
  return exchanges.reduce((sum, exchange) => sum + exchange.starsCost, 0);
}

/**
 * 计算孩子的可用星星数（总是从 Supabase 获取最新数据）
 */
export async function calculateAvailableStars(childId: string): Promise<number> {
  const totalEarned = await calculateTotalEarnedStars(childId);
  const exchanged = await calculateExchangedStars(childId);
  return totalEarned - exchanged;
}

/**
 * 同步版本（用于向后兼容，仅从 localStorage 读取）
 */
export function calculateAvailableStarsSync(childId: string): number {
  const dailyRecords = getAllDailyTaskRecordsSync(childId);
  const quizRecords = getQuizRecordsSync(childId);
  const exchanges = getRewardExchanges(childId);

  const dailyStars = dailyRecords.reduce(
    (sum, record) => sum + record.totalStars,
    0
  );
  const quizStars = quizRecords.reduce(
    (sum, record) => sum + record.rewardStars,
    0
  );
  const exchanged = exchanges.reduce((sum, exchange) => sum + exchange.starsCost, 0);

  return dailyStars + quizStars - exchanged;
}

