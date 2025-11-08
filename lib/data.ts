import type {
  DailyTaskRecord,
  QuizRecord,
  RewardExchange,
  SystemConfig,
  OperationLog,
} from "@/types";
import { STORAGE_KEYS } from "@/types";
import { updateChildStarsSync } from "@/lib/children";
import * as supabaseData from "@/lib/supabase/data";

// 获取当前日期字符串 (YYYY-MM-DD)
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

// ============ 每日任务数据管理 ============

// 获取每日任务记录（混合存储：优先从 localStorage，如果没有则从 Supabase 同步）
export async function getDailyTaskRecord(
  childId: string,
  date: string = getTodayDate()
): Promise<DailyTaskRecord | null> {
  if (typeof window === "undefined") return null;

  // 先尝试从 localStorage 读取
  const data = localStorage.getItem(STORAGE_KEYS.DAILY_TASKS);
  if (data) {
    try {
      const records: DailyTaskRecord[] = JSON.parse(data);
      const record = records.find((r) => r.childId === childId && r.date === date);
      if (record) {
        return record;
      }
    } catch {
      // 解析失败，继续从 Supabase 读取
    }
  }

  // 如果 localStorage 没有数据，从 Supabase 读取并缓存
  try {
    const response = await fetch(`/api/daily-tasks?childId=${childId}&date=${date}`);
    if (response.ok) {
      const result = await response.json();
      const record = result.record;
      if (record) {
        // 缓存到 localStorage
        const localData = localStorage.getItem(STORAGE_KEYS.DAILY_TASKS);
        let records: DailyTaskRecord[] = [];
        if (localData) {
          try {
            records = JSON.parse(localData);
          } catch {
            records = [];
          }
        }
        const index = records.findIndex((r) => r.childId === childId && r.date === date);
        if (index >= 0) {
          records[index] = record;
        } else {
          records.push(record);
        }
        localStorage.setItem(STORAGE_KEYS.DAILY_TASKS, JSON.stringify(records));
        return record;
      }
    }
  } catch (error) {
    console.error("从 Supabase 获取每日任务记录失败:", error);
  }

  return null;
}

// 同步版本（用于向后兼容）
export function getDailyTaskRecordSync(
  childId: string,
  date: string = getTodayDate()
): DailyTaskRecord | null {
  if (typeof window === "undefined") return null;

  const data = localStorage.getItem(STORAGE_KEYS.DAILY_TASKS);
  if (!data) return null;

  try {
    const records: DailyTaskRecord[] = JSON.parse(data);
    return (
      records.find((r) => r.childId === childId && r.date === date) || null
    );
  } catch {
    return null;
  }
}

// 获取所有每日任务记录（混合存储：优先从 localStorage，如果没有则从 Supabase 同步）
export async function getAllDailyTaskRecords(
  childId: string
): Promise<DailyTaskRecord[]> {
  if (typeof window === "undefined") return [];

  // 先尝试从 localStorage 读取
  const data = localStorage.getItem(STORAGE_KEYS.DAILY_TASKS);
  if (data) {
    try {
      const records: DailyTaskRecord[] = JSON.parse(data);
      const childRecords = records.filter((r) => r.childId === childId);
      if (childRecords.length > 0) {
        return childRecords;
      }
    } catch {
      // 解析失败，继续从 Supabase 读取
    }
  }

  // 如果 localStorage 没有数据，从 Supabase 读取并缓存
  try {
    const response = await fetch(`/api/daily-tasks?childId=${childId}`);
    if (response.ok) {
      const result = await response.json();
      const records = result.records || [];
      if (records.length > 0) {
        // 缓存到 localStorage
        const localData = localStorage.getItem(STORAGE_KEYS.DAILY_TASKS);
        let allRecords: DailyTaskRecord[] = [];
        if (localData) {
          try {
            allRecords = JSON.parse(localData);
          } catch {
            allRecords = [];
          }
        }
        // 合并并去重
        records.forEach((record: DailyTaskRecord) => {
          const index = allRecords.findIndex(
            (r) => r.childId === record.childId && r.date === record.date
          );
          if (index >= 0) {
            allRecords[index] = record;
          } else {
            allRecords.push(record);
          }
        });
        localStorage.setItem(STORAGE_KEYS.DAILY_TASKS, JSON.stringify(allRecords));
        return records;
      }
    }
  } catch (error) {
    console.error("从 Supabase 获取每日任务记录失败:", error);
  }

  return [];
}

// 同步版本（用于向后兼容）
export function getAllDailyTaskRecordsSync(
  childId: string
): DailyTaskRecord[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(STORAGE_KEYS.DAILY_TASKS);
  if (!data) return [];

  try {
    const records: DailyTaskRecord[] = JSON.parse(data);
    return records.filter((r) => r.childId === childId);
  } catch {
    return [];
  }
}

// 保存每日任务记录（同时写入 Supabase 和 localStorage）
export async function saveDailyTaskRecord(record: DailyTaskRecord): Promise<void> {
  if (typeof window === "undefined") return;

  // 先保存到 localStorage（快速响应）
  const data = localStorage.getItem(STORAGE_KEYS.DAILY_TASKS);
  let records: DailyTaskRecord[] = [];

  if (data) {
    try {
      records = JSON.parse(data);
    } catch {
      records = [];
    }
  }

  const index = records.findIndex(
    (r) => r.childId === record.childId && r.date === record.date
  );

  let delta = record.totalStars;
  if (index >= 0) {
    const old = records[index];
    records[index] = record;
    delta = record.totalStars - (old?.totalStars || 0);
  } else {
    records.push(record);
    delta = record.totalStars; // 新增记录，按当日总星星累计
  }

  localStorage.setItem(STORAGE_KEYS.DAILY_TASKS, JSON.stringify(records));
  
  // 同步更新孩子星星总数到 localStorage
  if (delta !== 0) {
    updateChildStarsSync(record.childId, delta);
  }

  // 异步保存到 Supabase（后台同步）
  try {
    const response = await fetch("/api/daily-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("保存每日任务记录到 Supabase 失败:", error);
    // 即使 Supabase 失败，localStorage 已经保存，不影响用户体验
  }
}

// ============ 单元测验数据管理 ============

// 获取单元测验记录（混合存储：优先从 localStorage，如果没有则从 Supabase 同步）
export async function getQuizRecords(childId: string): Promise<QuizRecord[]> {
  if (typeof window === "undefined") return [];

  // 先尝试从 localStorage 读取
  const data = localStorage.getItem(STORAGE_KEYS.QUIZ_RECORDS);
  if (data) {
    try {
      const records: QuizRecord[] = JSON.parse(data);
      const childRecords = records.filter((r) => r.childId === childId);
      if (childRecords.length > 0) {
        return childRecords;
      }
    } catch {
      // 解析失败，继续从 Supabase 读取
    }
  }

  // 如果 localStorage 没有数据，从 Supabase 读取并缓存
  try {
    const response = await fetch(`/api/quiz-records?childId=${childId}`);
    if (response.ok) {
      const result = await response.json();
      const records = result.records || [];
      if (records.length > 0) {
        // 缓存到 localStorage
        const localData = localStorage.getItem(STORAGE_KEYS.QUIZ_RECORDS);
        let allRecords: QuizRecord[] = [];
        if (localData) {
          try {
            allRecords = JSON.parse(localData);
          } catch {
            allRecords = [];
          }
        }
        // 合并并去重
        records.forEach((record: QuizRecord) => {
          const index = allRecords.findIndex((r) => r.id === record.id);
          if (index >= 0) {
            allRecords[index] = record;
          } else {
            allRecords.push(record);
          }
        });
        localStorage.setItem(STORAGE_KEYS.QUIZ_RECORDS, JSON.stringify(allRecords));
        return records;
      }
    }
  } catch (error) {
    console.error("从 Supabase 获取单元测验记录失败:", error);
  }

  return [];
}

// 同步版本（用于向后兼容）
export function getQuizRecordsSync(childId: string): QuizRecord[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(STORAGE_KEYS.QUIZ_RECORDS);
  if (!data) return [];

  try {
    const records: QuizRecord[] = JSON.parse(data);
    return records.filter((r) => r.childId === childId);
  } catch {
    return [];
  }
}

// 添加单元测验记录（同时写入 Supabase 和 localStorage）
export async function addQuizRecord(record: Omit<QuizRecord, "id">): Promise<QuizRecord> {
  if (typeof window === "undefined") {
    throw new Error("Cannot save in server environment");
  }

  // 先保存到 localStorage（快速响应）
  const newRecord: QuizRecord = {
    ...record,
    id: `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };

  const data = localStorage.getItem(STORAGE_KEYS.QUIZ_RECORDS);
  let records: QuizRecord[] = [];

  if (data) {
    try {
      records = JSON.parse(data);
    } catch {
      records = [];
    }
  }

  records.push(newRecord);
  localStorage.setItem(STORAGE_KEYS.QUIZ_RECORDS, JSON.stringify(records));

  // 同步更新孩子星星总数到 localStorage
  updateChildStarsSync(newRecord.childId, newRecord.rewardStars);

  // 异步保存到 Supabase（后台同步）
  try {
    const response = await fetch("/api/quiz-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    // 如果 Supabase 返回了 ID，使用 Supabase 的 ID
    if (result.record?.id) {
      newRecord.id = result.record.id;
      // 更新 localStorage 中的 ID
      const index = records.findIndex((r) => r.id === newRecord.id);
      if (index >= 0) {
        records[index] = newRecord;
        localStorage.setItem(STORAGE_KEYS.QUIZ_RECORDS, JSON.stringify(records));
      }
    }
  } catch (error) {
    console.error("保存单元测验记录到 Supabase 失败:", error);
    // 即使 Supabase 失败，localStorage 已经保存，不影响用户体验
  }

  return newRecord;
}

export function updateQuizRecord(
  id: string,
  updates: Partial<QuizRecord>
): boolean {
  if (typeof window === "undefined") return false;

  const data = localStorage.getItem(STORAGE_KEYS.QUIZ_RECORDS);
  if (!data) return false;

  try {
    const records: QuizRecord[] = JSON.parse(data);
    const index = records.findIndex((r) => r.id === id);

    if (index === -1) return false;

    const oldRecord = records[index];
    records[index] = { ...records[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.QUIZ_RECORDS, JSON.stringify(records));

    // 如果修改了rewardStars，更新孩子的星星总数
    if (updates.rewardStars !== undefined) {
      const delta = updates.rewardStars - oldRecord.rewardStars;
      updateChildStarsSync(records[index].childId, delta);
    }

    return true;
  } catch {
    return false;
  }
}

// ============ 兑换记录数据管理 ============

export function getRewardExchanges(childId: string): RewardExchange[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(STORAGE_KEYS.REWARD_EXCHANGES);
  if (!data) return [];

  try {
    const exchanges: RewardExchange[] = JSON.parse(data);
    return exchanges.filter((e) => e.childId === childId);
  } catch {
    return [];
  }
}

// 添加兑换记录（同时写入 Supabase 和 localStorage）
export async function addRewardExchange(
  exchange: Omit<RewardExchange, "id" | "date">
): Promise<RewardExchange> {
  if (typeof window === "undefined") {
    throw new Error("Cannot save in server environment");
  }

  // 先保存到 localStorage（快速响应）
  const newExchange: RewardExchange = {
    ...exchange,
    id: `reward-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: getTodayDate(),
  };

  const data = localStorage.getItem(STORAGE_KEYS.REWARD_EXCHANGES);
  let exchanges: RewardExchange[] = [];

  if (data) {
    try {
      exchanges = JSON.parse(data);
    } catch {
      exchanges = [];
    }
  }

  exchanges.push(newExchange);
  localStorage.setItem(
    STORAGE_KEYS.REWARD_EXCHANGES,
    JSON.stringify(exchanges)
  );

  // 同步扣除孩子星星到 localStorage
  updateChildStarsSync(newExchange.childId, -newExchange.starsCost);

  // 异步保存到 Supabase（后台同步）
  try {
    const supabaseExchange = await supabaseData.addRewardExchange(exchange);
    // 如果 Supabase 返回了 ID，使用 Supabase 的 ID
    if (supabaseExchange.id) {
      newExchange.id = supabaseExchange.id;
      // 更新 localStorage 中的 ID
      const index = exchanges.findIndex((e) => e.id === newExchange.id);
      if (index >= 0) {
        exchanges[index] = newExchange;
        localStorage.setItem(STORAGE_KEYS.REWARD_EXCHANGES, JSON.stringify(exchanges));
      }
    }
  } catch (error) {
    console.error("保存兑换记录到 Supabase 失败:", error);
    // 即使 Supabase 失败，localStorage 已经保存，不影响用户体验
  }

  return newExchange;
}

export function updateRewardExchangeStatus(
  id: string,
  status: RewardExchange["status"]
): boolean {
  if (typeof window === "undefined") return false;

  const data = localStorage.getItem(STORAGE_KEYS.REWARD_EXCHANGES);
  if (!data) return false;

  try {
    const exchanges: RewardExchange[] = JSON.parse(data);
    const index = exchanges.findIndex((e) => e.id === id);

    if (index === -1) return false;

    exchanges[index].status = status;
    localStorage.setItem(
      STORAGE_KEYS.REWARD_EXCHANGES,
      JSON.stringify(exchanges)
    );

    return true;
  } catch {
    return false;
  }
}

// ============ 系统配置管理 ============

export function getSystemConfig(): SystemConfig {
  if (typeof window === "undefined") {
    return { currentChildId: null };
  }

  const data = localStorage.getItem(STORAGE_KEYS.SYSTEM_CONFIG);
  if (!data) {
    return { currentChildId: null };
  }

  try {
    return JSON.parse(data) as SystemConfig;
  } catch {
    return { currentChildId: null };
  }
}

export function saveSystemConfig(config: Partial<SystemConfig>): void {
  if (typeof window === "undefined") return;

  const current = getSystemConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(updated));
}

// ============ 操作日志管理 ============

export function addOperationLog(log: Omit<OperationLog, "id">): void {
  if (typeof window === "undefined") return;

  const newLog: OperationLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };

  const data = localStorage.getItem(STORAGE_KEYS.OPERATION_LOGS);
  let logs: OperationLog[] = [];

  if (data) {
    try {
      logs = JSON.parse(data);
    } catch {
      logs = [];
    }
  }

  logs.push(newLog);

  // 只保留最近1000条日志
  if (logs.length > 1000) {
    logs = logs.slice(-1000);
  }

  localStorage.setItem(STORAGE_KEYS.OPERATION_LOGS, JSON.stringify(logs));
}

export function getOperationLogs(childId?: string): OperationLog[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(STORAGE_KEYS.OPERATION_LOGS);
  if (!data) return [];

  try {
    const logs: OperationLog[] = JSON.parse(data);
    if (childId) {
      return logs.filter((log) => log.childId === childId);
    }
    return logs;
  } catch {
    return [];
  }
}

