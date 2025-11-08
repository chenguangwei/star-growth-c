import type {
  DailyTaskRule,
  QuizRule,
  RewardRule,
  Reward,
} from "@/types";

// 每日任务规则定义（默认规则）
export const DEFAULT_DAILY_TASK_RULES: DailyTaskRule[] = [
  {
    id: "on-time-start",
    name: "准时启动奖",
    description: "无需催促，在约定时间主动开始学习",
    baseStars: 1,
    type: "simple",
  },
  {
    id: "morning-reading",
    name: "晨读之星",
    description: "每日坚持早读15分钟（朗读课文或指定读物），声音洪亮，有感情。",
    baseStars: 1,
    type: "simple",
  },
  {
    id: "dictation-challenge",
    name: "听写/默写挑战",
    description: "根据学校/家庭的听写结果（不低于15组）",
    baseStars: 5,
    type: "input",
    inputConfig: {
      fields: [
        { name: "correctCount", label: "正确数量", type: "number" },
        { name: "errorCount", label: "错误数量", type: "number" },
      ],
      calculateStars: (data) => {
        const correct = data.correctCount || 0;
        const error = data.errorCount || 0;
        const total = correct + error;
        
        if (total < 15) return 0;
        if (error === 0) return 5; // 全对
        if (error >= 1 && error <= 3) return 3; // 错1-3个
        // 超过15组且全对：正确5个加1星
        if (error === 0 && correct > 15) {
          return 5 + Math.floor((correct - 15) / 5);
        }
        return 0;
      },
    },
  },
  {
    id: "focus-tomato",
    name: "专注番茄奖",
    description: "每完成一个15-20分钟的专注学习时间，不离开座位，不玩小动作，只专注于当前任务。",
    baseStars: 2,
    maxCount: 3,
    type: "countable",
  },
  {
    id: "anti-interference",
    name: "抗干扰小勇士",
    description: "当周围有轻微干扰时（如家人走动），能不受影响，继续完成任务。",
    baseStars: 1,
    maxCount: 4,
    type: "countable",
  },
  {
    id: "checklist-completion",
    name: "清单完成奖",
    description: "完成所有作业清单上的任务",
    baseStars: 1,
    type: "input",
    inputConfig: {
      fields: [
        { name: "taskCount", label: "完成任务数量", type: "number" },
      ],
      calculateStars: (data) => {
        const count = data.taskCount || 0;
        return Math.floor(count / 2); // 每两项任务1个星星
      },
    },
  },
  {
    id: "try-first",
    name: "\"我先试一试\"奖",
    description: "遇到难题时，不沮丧，不发脾气，没有立刻喊\"妈妈/爸爸我不会\"，而是自己先独立冷静思考。并进行了尝试。",
    baseStars: 1,
    maxCount: 4,
    type: "countable",
  },
  {
    id: "reading",
    name: "阅读小能手",
    description: "完成每日的阅读任务（亲子或自主）",
    baseStars: 1,
    type: "simple",
  },
  {
    id: "calculation",
    name: "计算小能手",
    description: "每天5题口算+3题竖式题规定时间内完成/全对",
    baseStars: 2,
    type: "input",
    inputConfig: {
      fields: [
        { name: "oralCount", label: "口算题数", type: "number" },
        { name: "writtenCount", label: "竖式题数", type: "number" },
        { name: "allCorrect", label: "是否全对", type: "number" }, // 0或1
      ],
      calculateStars: (data) => {
        const oral = data.oralCount || 0;
        const written = data.writtenCount || 0;
        const allCorrect = data.allCorrect === 1;
        
        if (oral >= 5 && written >= 3 && allCorrect) return 3;
        if (oral >= 5 && written >= 3) return 2;
        return 0;
      },
    },
  },
  {
    id: "planner",
    name: "小小规划师",
    description: "在写作业前，能和父母一起/独立列出每天的\"任务清单\"，并规划好先后顺序。完成任务清单任务（周末清单必须包含卷子练习任务）。",
    baseStars: 1,
    type: "simple",
  },
  {
    id: "tidiness",
    name: "整洁小能手",
    description: "学习结束后，能自己整理好书桌，将书本、文具归位，保持\"学习角\"的整洁并整理好明天的上课书籍。",
    baseStars: 1,
    type: "simple",
  },
  {
    id: "housework",
    name: "家务小帮手",
    description: "主动完成一件力所能及的家务",
    baseStars: 1,
    maxCount: 2,
    type: "countable",
  },
  {
    id: "sibling-help",
    name: "姐妹互助奖",
    description: "主动帮助或安慰对方，双方配合很好完成任务。各得一星。",
    baseStars: 1,
    type: "simple",
  },
  {
    id: "self-review",
    name: "自主复习奖",
    description: "在没有被要求的情况下，主动完成15分钟的复习或预习：复习昨天/一周的课题笔记或者学习单、整理并认真复习自己之前的错题本、预习明天/下周要学的新内容。",
    baseStars: 1,
    type: "simple",
  },
];

// 为了向后兼容，保留 DAILY_TASK_RULES 作为默认规则的别名
export const DAILY_TASK_RULES = DEFAULT_DAILY_TASK_RULES;

// 获取孩子的任务规则（优先从数据库读取，如果没有则使用默认规则）
export async function getChildTaskRules(childId?: string): Promise<DailyTaskRule[]> {
  if (!childId) {
    // 如果没有孩子ID，返回默认规则
    return DEFAULT_DAILY_TASK_RULES;
  }

  try {
    // 通过 API 路由获取任务规则（绕过 RLS）
    const response = await fetch(`/api/task-rules?childId=${childId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    const childRules = result.rules || [];
    
    // 如果孩子有自定义规则，返回自定义规则
    // 否则返回默认规则
    return childRules.length > 0 ? childRules : DEFAULT_DAILY_TASK_RULES;
  } catch (error) {
    console.error("获取孩子任务规则失败:", error);
    // 出错时返回默认规则
    return DEFAULT_DAILY_TASK_RULES;
  }
}

// 单元测验规则
export const QUIZ_RULES: QuizRule[] = [
  {
    grade: 3,
    rewardStars: 0, // 3星不奖励，但触发特殊任务
    specialTasks: [
      {
        condition: "3星",
        taskName: "智慧星任务：认真订正并弄懂所有错题，可讲解",
        rewardStars: 5,
      },
    ],
  },
  {
    grade: 4,
    rewardStars: 6,
    progressBonus: {
      from: 3,
      to: 4,
      bonusStars: 8, // 3星到4星达成"进步目标"
    },
  },
  {
    grade: 5,
    rewardStars: 15,
    progressBonus: {
      from: 4,
      to: 5,
      bonusStars: 0, // 没有额外进步奖励
    },
  },
];

// 奖励兑换规则
export const REWARD_RULE: RewardRule = {
  coinExchangeRates: [
    {
      threshold: 40,
      rate: 2, // 超过40星星：2个星星1元
    },
    {
      threshold: 0,
      rate: 3, // 低于40：3个星星1元
    },
  ],
  specialRate: {
    threshold: 200,
    multiplier: 0.8, // 超过200星星：星星数 * 0.8 = 兑换钱币数
  },
};

// 默认奖励菜单
export const DEFAULT_REWARDS: Reward[] = [
  {
    id: "video-time",
    name: "视频/游戏时间券",
    description: "兑换30分钟自由支配的视频时间（禁止短视频）",
    starsCost: 15,
    category: "娱乐",
  },
  {
    id: "small-things",
    name: "\"小玩意儿\"基金",
    description: "兑换10元购物额度（文具、贴纸、零食等）",
    starsCost: 25,
    category: "购物",
  },
  {
    id: "claw-machine",
    name: "抓娃娃体验券",
    description: "兑换30个游戏币或者20元，用于抓娃娃",
    starsCost: 40,
    category: "娱乐",
  },
  {
    id: "heart-things",
    name: "\"心动好物\"基金",
    description: "兑换30元购物额度（漫画书、小玩具等）",
    starsCost: 60,
    category: "购物",
  },
  {
    id: "special-gift",
    name: "\"专属礼物\"基金",
    description: "兑换100元购物额度，（买心仪的礼物或对应金额的抓娃娃等）",
    starsCost: 180,
    category: "购物",
  },
];

// 计算钱币兑换比例
export function calculateCoinRate(totalStars: number): number {
  if (REWARD_RULE.specialRate && totalStars >= REWARD_RULE.specialRate.threshold) {
    return REWARD_RULE.specialRate.multiplier || 1;
  }
  
  // 找到适用的兑换比例
  const applicableRate = REWARD_RULE.coinExchangeRates
    .sort((a, b) => b.threshold - a.threshold)
    .find((rate) => totalStars >= rate.threshold);
  
  return applicableRate ? applicableRate.rate : 3;
}

// 将星星转换为钱币
export function starsToCoins(stars: number, totalStars: number): number {
  if (REWARD_RULE.specialRate && totalStars >= REWARD_RULE.specialRate.threshold) {
    return stars * (REWARD_RULE.specialRate.multiplier || 1);
  }
  
  const rate = calculateCoinRate(totalStars);
  return stars / rate;
}

