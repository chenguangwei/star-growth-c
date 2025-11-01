// 孩子/用户数据类型
export interface Child {
  id: string;
  name: string;
  avatar: string; // emoji或URL
  createdAt: string; // ISO日期字符串
  totalStars: number;
  settings?: {
    themeColor?: string;
    [key: string]: any;
  };
}

// 每日任务项
export interface DailyTaskItem {
  taskId: string;
  taskName: string;
  completed: boolean;
  stars: number;
  count?: number; // 用于需要计数的任务（如专注番茄奖）
  metadata?: {
    // 特殊任务的额外数据
    correctCount?: number; // 听写正确数
    errorCount?: number; // 听写错误数
    [key: string]: any;
  };
}

// 每日任务记录
export interface DailyTaskRecord {
  childId: string;
  date: string; // YYYY-MM-DD格式
  tasks: Record<string, DailyTaskItem>;
  totalStars: number;
  notes?: string;
}

// 单元测验记录
export interface QuizRecord {
  id: string;
  childId: string;
  date: string; // YYYY-MM-DD格式
  subject: "语文" | "数学" | "英语";
  grade: 3 | 4 | 5; // 3星/4星/5星
  rewardStars: number;
  corrected: boolean; // 是否已完成订正任务
  previousGrade?: 3 | 4 | 5; // 上次成绩（用于计算进步）
  notes?: string;
}

// 奖励兑换项
export interface Reward {
  id: string;
  name: string;
  description?: string;
  starsCost: number;
  category?: string;
}

// 兑换记录
export interface RewardExchange {
  id: string;
  childId: string;
  date: string; // YYYY-MM-DD格式
  rewardId: string;
  rewardName: string;
  starsCost: number;
  status: "used" | "pending";
  notes?: string;
}

// 系统配置
export interface SystemConfig {
  adminPassword?: string; // 加密后的密码
  currentChildId: string | null;
  rules?: {
    // 规则配置
    dailyTasks?: DailyTaskRule[];
    quizRules?: QuizRule[];
    rewardRules?: RewardRule;
  };
  rewards?: Reward[]; // 兑换菜单
}

// 每日任务规则定义
export interface DailyTaskRule {
  id: string;
  name: string;
  description: string;
  baseStars: number;
  maxCount?: number; // 最大完成次数（如专注番茄奖每天最多3次）
  type: "simple" | "countable" | "input"; // 简单任务/可计数任务/需要输入的任务
  inputConfig?: {
    // 需要输入的任务配置
    fields?: Array<{
      name: string;
      label: string;
      type: "number" | "text";
    }>;
    calculateStars?: (data: Record<string, any>) => number;
  };
}

// 单元测验规则
export interface QuizRule {
  grade: 3 | 4 | 5;
  rewardStars: number;
  specialTasks?: Array<{
    condition: string;
    taskName: string;
    rewardStars: number;
  }>;
  progressBonus?: {
    // 进步奖励
    from: 3 | 4;
    to: 4 | 5;
    bonusStars: number;
  };
}

// 奖励兑换规则（钱币换算）
export interface RewardRule {
  coinExchangeRates: {
    threshold: number; // 星星数量阈值
    rate: number; // 兑换比例：星星数/rate = 钱币数
  }[];
  specialRate?: {
    // 特殊规则：超过200星星
    threshold: number;
    multiplier: number; // 星星数 * multiplier = 兑换钱币数
  };
}

// 统计数据类型
export interface Statistics {
  childId: string;
  totalStars: number;
  weeklyStars: number;
  monthlyStars: number;
  dailyStars: Array<{
    date: string;
    stars: number;
  }>;
  taskCompletionRate: number;
  topTasks: Array<{
    taskId: string;
    taskName: string;
    completionCount: number;
  }>;
}

// 操作历史（用于父母后台）
export interface OperationLog {
  id: string;
  childId: string;
  type: "task" | "quiz" | "reward" | "manual_adjust" | "deception";
  action: string;
  date: string;
  starsChange?: number;
  reason?: string;
  operator?: string; // 操作人（父母）
}

// localStorage存储键名
export const STORAGE_KEYS = {
  CHILDREN: "star_growth_children",
  CURRENT_CHILD: "star_growth_current_child",
  DAILY_TASKS: "star_growth_daily_tasks",
  QUIZ_RECORDS: "star_growth_quiz_records",
  REWARD_EXCHANGES: "star_growth_reward_exchanges",
  SYSTEM_CONFIG: "star_growth_system_config",
  OPERATION_LOGS: "star_growth_operation_logs",
} as const;

