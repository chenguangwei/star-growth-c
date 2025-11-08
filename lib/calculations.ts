import {
  getAllDailyTaskRecordsSync,
  getQuizRecordsSync,
  getRewardExchanges,
} from "@/lib/data";

/**
 * 计算孩子的总获得星星数（从所有记录中计算，支持异步从 Supabase 同步）
 */
export async function calculateTotalEarnedStars(childId: string): Promise<number> {
  // 先尝试从 localStorage 读取（快速）
  let dailyRecords = getAllDailyTaskRecordsSync(childId);
  let quizRecords = getQuizRecordsSync(childId);

  // 如果 localStorage 数据不足，从 Supabase 同步
  if (dailyRecords.length === 0 || quizRecords.length === 0) {
    try {
      const { getAllDailyTaskRecords, getQuizRecords } = await import("@/lib/data");
      if (dailyRecords.length === 0) {
        dailyRecords = await getAllDailyTaskRecords(childId);
      }
      if (quizRecords.length === 0) {
        quizRecords = await getQuizRecords(childId);
      }
    } catch (error) {
      console.error("同步数据失败:", error);
    }
  }

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

/**
 * 计算孩子的已兑换星星数
 */
export function calculateExchangedStars(childId: string): number {
  const exchanges = getRewardExchanges(childId);
  return exchanges.reduce((sum, exchange) => sum + exchange.starsCost, 0);
}

/**
 * 计算孩子的可用星星数（支持异步从 Supabase 同步）
 */
export async function calculateAvailableStars(childId: string): Promise<number> {
  const totalEarned = await calculateTotalEarnedStars(childId);
  const exchanged = calculateExchangedStars(childId);
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

