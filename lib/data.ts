import type {
  DailyTaskRecord,
  QuizRecord,
  RewardExchange,
  SystemConfig,
  OperationLog,
} from "@/types";
import { STORAGE_KEYS } from "@/types";
import { updateChildStars } from "@/lib/children";

// 获取当前日期字符串 (YYYY-MM-DD)
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

// ============ 每日任务数据管理 ============

export function getDailyTaskRecord(
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

export function getAllDailyTaskRecords(
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

export function saveDailyTaskRecord(record: DailyTaskRecord): void {
  if (typeof window === "undefined") return;

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

  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }

  localStorage.setItem(STORAGE_KEYS.DAILY_TASKS, JSON.stringify(records));
  
  // 更新孩子的星星总数
  updateChildStars(record.childId, record.totalStars);
}

// ============ 单元测验数据管理 ============

export function getQuizRecords(childId: string): QuizRecord[] {
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

export function addQuizRecord(record: Omit<QuizRecord, "id">): QuizRecord {
  if (typeof window === "undefined") {
    throw new Error("Cannot save in server environment");
  }

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

  // 更新孩子的星星总数
  updateChildStars(newRecord.childId, newRecord.rewardStars);

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
      updateChildStars(records[index].childId, delta);
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

export function addRewardExchange(
  exchange: Omit<RewardExchange, "id" | "date">
): RewardExchange {
  if (typeof window === "undefined") {
    throw new Error("Cannot save in server environment");
  }

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

  // 扣除孩子的星星
  updateChildStars(newExchange.childId, -newExchange.starsCost);

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

