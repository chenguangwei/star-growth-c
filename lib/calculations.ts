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
  // 先尝试从 localStorage 读取（快速响应）
  const localExchanges = getRewardExchanges(childId);
  const localExchanged = localExchanges.reduce((sum, exchange) => sum + exchange.starsCost, 0);
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/386a1f2e-b938-40b6-90a2-1cfb52f7051d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/calculations.ts:47',message:'calculateExchangedStars开始',data:{childId,localExchangesCount:localExchanges.length,localExchanged},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  try {
    // 总是从 Supabase 获取最新数据（确保数据同步）
    const response = await fetch(`/api/reward-exchanges?childId=${childId}`);
    if (response.ok) {
      const result = await response.json();
      const exchanges = result.exchanges || [];
      const supabaseExchanged = exchanges.reduce((sum: number, exchange: any) => sum + exchange.starsCost, 0);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/386a1f2e-b938-40b6-90a2-1cfb52f7051d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/calculations.ts:60',message:'API返回成功',data:{supabaseExchangesCount:exchanges.length,supabaseExchanged,localExchanged,localExchangesCount:localExchanges.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // 如果 localStorage 有更多记录（说明有最新兑换但 Supabase 还没同步），使用 localStorage 的数据
      // 否则使用 Supabase 的数据（更准确，因为它是权威数据源）
      if (localExchanges.length > exchanges.length || localExchanged > supabaseExchanged) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/386a1f2e-b938-40b6-90a2-1cfb52f7051d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/calculations.ts:67',message:'localStorage有更多数据，使用localStorage',data:{localExchanged,supabaseExchanged},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        return localExchanged;
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/386a1f2e-b938-40b6-90a2-1cfb52f7051d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/calculations.ts:72',message:'使用Supabase数据',data:{supabaseExchanged},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // 返回 Supabase 的数据（更准确）
      return supabaseExchanged;
    }
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/386a1f2e-b938-40b6-90a2-1cfb52f7051d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/calculations.ts:78',message:'API失败，使用localStorage',data:{error:error instanceof Error?error.message:String(error),localExchanged},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.error("获取兑换记录失败，使用 localStorage 数据:", error);
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/386a1f2e-b938-40b6-90a2-1cfb52f7051d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/calculations.ts:84',message:'返回localStorage数据',data:{localExchanged},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  // 如果 Supabase 失败，回退到 localStorage（用于离线场景）
  return localExchanged;
}

/**
 * 计算孩子的可用星星数（总是从 Supabase 获取最新数据）
 */
export async function calculateAvailableStars(childId: string): Promise<number> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/386a1f2e-b938-40b6-90a2-1cfb52f7051d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/calculations.ts:73',message:'calculateAvailableStars开始',data:{childId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  const totalEarned = await calculateTotalEarnedStars(childId);
  const exchanged = await calculateExchangedStars(childId);
  const available = totalEarned - exchanged;
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/386a1f2e-b938-40b6-90a2-1cfb52f7051d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/calculations.ts:77',message:'calculateAvailableStars完成',data:{totalEarned,exchanged,available},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  return available;
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

