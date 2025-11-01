import {
  getAllDailyTaskRecords,
  getQuizRecords,
  getRewardExchanges,
} from "@/lib/data";

/**
 * 计算孩子的总获得星星数（从所有记录中计算）
 */
export function calculateTotalEarnedStars(childId: string): number {
  const dailyRecords = getAllDailyTaskRecords(childId);
  const quizRecords = getQuizRecords(childId);

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
 * 计算孩子的可用星星数
 */
export function calculateAvailableStars(childId: string): number {
  const totalEarned = calculateTotalEarnedStars(childId);
  const exchanged = calculateExchangedStars(childId);
  return totalEarned - exchanged;
}

