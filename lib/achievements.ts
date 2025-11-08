import type {
  Achievement,
  AchievementCondition,
  AchievementRecord,
  DailyTaskRecord,
  QuizRecord,
} from "@/types";

// 成就徽章配置
export const ACHIEVEMENTS: Achievement[] = [
  // 专注力相关成就
  {
    id: "focus-master-7",
    name: "专注力大师",
    emoji: "🎯",
    description: "连续7天完成3次专注番茄",
    condition: {
      type: "streak",
      taskId: "focus-tomato",
      value: 7,
      period: "all_time",
    },
    rarity: "rare",
    rewardStars: 10,
    category: "专注力",
  },
  {
    id: "focus-master-30",
    name: "专注力传奇",
    emoji: "🏆",
    description: "连续30天完成专注番茄",
    condition: {
      type: "streak",
      taskId: "focus-tomato",
      value: 30,
      period: "all_time",
    },
    rarity: "legendary",
    rewardStars: 50,
    category: "专注力",
  },
  {
    id: "focus-total-100",
    name: "专注百次",
    emoji: "💎",
    description: "累计完成100次专注番茄",
    condition: {
      type: "count",
      taskId: "focus-tomato",
      value: 100,
      period: "all_time",
    },
    rarity: "epic",
    rewardStars: 30,
    category: "专注力",
  },
  
  // 坚持相关成就
  {
    id: "perfect-week",
    name: "完美一周",
    emoji: "⭐",
    description: "一周内每天完成所有任务",
    condition: {
      type: "perfect_days",
      value: 7,
      period: "weekly",
    },
    rarity: "epic",
    rewardStars: 20,
    category: "坚持",
  },
  {
    id: "perfect-month",
    name: "完美一月",
    emoji: "🌟",
    description: "一个月内每天完成所有任务",
    condition: {
      type: "perfect_days",
      value: 30,
      period: "monthly",
    },
    rarity: "legendary",
    rewardStars: 100,
    category: "坚持",
  },
  {
    id: "persistence-7",
    name: "坚持小王子/小公主",
    emoji: "👑",
    description: "连续7天完成至少5个任务",
    condition: {
      type: "streak",
      value: 7,
      period: "all_time",
    },
    rarity: "rare",
    rewardStars: 15,
    category: "坚持",
  },
  {
    id: "persistence-30",
    name: "坚持之王/之后",
    emoji: "👸",
    description: "连续30天完成至少5个任务",
    condition: {
      type: "streak",
      value: 30,
      period: "all_time",
    },
    rarity: "legendary",
    rewardStars: 80,
    category: "坚持",
  },
  
  // 星星收集相关成就
  {
    id: "star-collector-100",
    name: "星星收集家",
    emoji: "✨",
    description: "累计获得100颗星星",
    condition: {
      type: "total_stars",
      value: 100,
      period: "all_time",
    },
    rarity: "common",
    rewardStars: 5,
    category: "收集",
  },
  {
    id: "star-collector-500",
    name: "星星收藏家",
    emoji: "💫",
    description: "累计获得500颗星星",
    condition: {
      type: "total_stars",
      value: 500,
      period: "all_time",
    },
    rarity: "rare",
    rewardStars: 25,
    category: "收集",
  },
  {
    id: "star-collector-1000",
    name: "星星大师",
    emoji: "🌟",
    description: "累计获得1000颗星星",
    condition: {
      type: "total_stars",
      value: 1000,
      period: "all_time",
    },
    rarity: "epic",
    rewardStars: 100,
    category: "收集",
  },
  {
    id: "star-collector-5000",
    name: "星星传奇",
    emoji: "⭐",
    description: "累计获得5000颗星星",
    condition: {
      type: "total_stars",
      value: 5000,
      period: "all_time",
    },
    rarity: "legendary",
    rewardStars: 500,
    category: "收集",
  },
  
  // 学习能力相关成就
  {
    id: "explorer-10",
    name: "探索小达人",
    emoji: "🔍",
    description: "累计10次独立尝试解决难题",
    condition: {
      type: "count",
      taskId: "try-first",
      value: 10,
      period: "all_time",
    },
    rarity: "common",
    rewardStars: 5,
    category: "学习能力",
  },
  {
    id: "explorer-50",
    name: "探索大师",
    emoji: "🧭",
    description: "累计50次独立尝试解决难题",
    condition: {
      type: "count",
      taskId: "try-first",
      value: 50,
      period: "all_time",
    },
    rarity: "epic",
    rewardStars: 30,
    category: "学习能力",
  },
  
  // 测验相关成就
  {
    id: "quiz-excellent-10",
    name: "测验小能手",
    emoji: "📝",
    description: "累计10次获得5星测验成绩",
    condition: {
      type: "task_specific", // 使用task_specific类型，在检测时特殊处理
      value: 10,
      period: "all_time",
    },
    rarity: "rare",
    rewardStars: 20,
    category: "测验",
  },
  {
    id: "quiz-progress-5",
    name: "进步之星",
    emoji: "📈",
    description: "累计5次达成进步目标（3星到4星或4星到5星）",
    condition: {
      type: "combo",
      value: 5,
      period: "all_time",
    },
    rarity: "epic",
    rewardStars: 40,
    category: "测验",
  },
  
  // 生活技能相关成就
  {
    id: "helper-30",
    name: "家务小能手",
    emoji: "🧹",
    description: "累计完成30次家务",
    condition: {
      type: "count",
      taskId: "housework",
      value: 30,
      period: "all_time",
    },
    rarity: "common",
    rewardStars: 10,
    category: "生活技能",
  },
  {
    id: "helper-100",
    name: "家务大师",
    emoji: "🏠",
    description: "累计完成100次家务",
    condition: {
      type: "count",
      taskId: "housework",
      value: 100,
      period: "all_time",
    },
    rarity: "epic",
    rewardStars: 50,
    category: "生活技能",
  },
];

/**
 * 检查成就条件是否满足
 */
export function checkAchievementCondition(
  condition: AchievementCondition,
  data: {
    dailyRecords: DailyTaskRecord[];
    quizRecords: QuizRecord[];
    totalStars: number;
  }
): { completed: boolean; progress: number } {
  const { type, taskId, value, period } = condition;
  
  let progress = 0;
  let completed = false;
  
  switch (type) {
    case "count":
      // 统计特定任务或所有任务的完成次数
      if (taskId) {
        // 特定任务计数
        progress = data.dailyRecords.reduce((sum, record) => {
          const task = record.tasks[taskId];
          if (!task) return sum;
          // 如果有详细记录，使用详细记录数量
          if (task.countDetails && task.countDetails.length > 0) {
            return sum + task.countDetails.length;
          }
          // 否则使用count字段或completed状态
          return sum + (task.completed ? (task.count || 1) : 0);
        }, 0);
      } else {
        // 所有任务计数（用于测验等）
        // 默认统计所有测验记录
        progress = data.quizRecords.length;
      }
      completed = progress >= value;
      break;
      
    case "streak":
      // 连续完成天数
      if (taskId) {
        // 特定任务的连续完成
        const sortedRecords = [...data.dailyRecords].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        let streak = 0;
        let lastDate: Date | null = null;
        
        for (const record of sortedRecords) {
          const task = record.tasks[taskId];
          if (task?.completed) {
            const recordDate = new Date(record.date);
            if (!lastDate) {
              lastDate = recordDate;
              streak = 1;
            } else {
              const daysDiff = Math.floor(
                (lastDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              if (daysDiff === 1) {
                streak++;
                lastDate = recordDate;
              } else {
                break;
              }
            }
          } else {
            break;
          }
        }
        progress = streak;
      } else {
        // 连续N天完成至少X个任务
        const sortedRecords = [...data.dailyRecords].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        let streak = 0;
        let lastDate: Date | null = null;
        
        for (const record of sortedRecords) {
          const completedCount = Object.values(record.tasks || {}).filter(
            (t) => t.completed
          ).length;
          
          if (completedCount >= 5) {
            const recordDate = new Date(record.date);
            if (!lastDate) {
              lastDate = recordDate;
              streak = 1;
            } else {
              const daysDiff = Math.floor(
                (lastDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              if (daysDiff === 1) {
                streak++;
                lastDate = recordDate;
              } else {
                break;
              }
            }
          } else {
            break;
          }
        }
        progress = streak;
      }
      completed = progress >= value;
      break;
      
    case "total_stars":
      progress = data.totalStars;
      completed = progress >= value;
      break;
      
    case "perfect_days":
      // 完美天数（完成所有任务）
      const sortedRecords = [...data.dailyRecords].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      // 获取任务总数（从第一条记录推断）
      const taskCount = sortedRecords[0]
        ? Object.keys(sortedRecords[0].tasks || {}).length
        : 0;
      
      let perfectDays = 0;
      const now = new Date();
      let checkDate = new Date(now);
      
      if (period === "weekly") {
        checkDate.setDate(now.getDate() - 7);
      } else if (period === "monthly") {
        checkDate.setMonth(now.getMonth() - 1);
      }
      
      for (let d = new Date(checkDate); d <= now; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const record = sortedRecords.find((r) => r.date === dateStr);
        
        if (record) {
          const completedCount = Object.values(record.tasks || {}).filter(
            (t) => t.completed
          ).length;
          if (completedCount >= taskCount && taskCount > 0) {
            perfectDays++;
          }
        }
      }
      
      progress = perfectDays;
      completed = progress >= value;
      break;
      
    case "combo":
      // 组合成就（如进步目标）
      progress = data.quizRecords.filter((r) => {
        // 检查是否有进步（需要previousGrade和grade）
        // 3星到4星，或4星到5星
        if (r.previousGrade && r.grade) {
          return (r.previousGrade === 3 && r.grade === 4) || 
                 (r.previousGrade === 4 && r.grade === 5);
        }
        return false;
      }).length;
      completed = progress >= value;
      break;
      
    case "task_specific":
      // 特定任务相关成就（特殊处理）
      // 对于测验5星成就，统计grade为5的记录
      if (!taskId) {
        // 测验5星成就
        progress = data.quizRecords.filter((r) => r.grade === 5).length;
        completed = progress >= value;
      } else {
        // 其他特定任务（通过count + taskId处理）
        completed = false;
        progress = 0;
      }
      break;
      
    default:
      completed = false;
      progress = 0;
  }
  
  return { completed, progress };
}

/**
 * 检查并更新所有成就
 */
export async function checkAndUpdateAchievements(
  childId: string,
  data: {
    dailyRecords: DailyTaskRecord[];
    quizRecords: QuizRecord[];
    totalStars: number;
  }
): Promise<AchievementRecord[]> {
  // 获取已解锁的成就记录
  const response = await fetch(`/api/achievements?childId=${childId}`);
  const existingRecords: AchievementRecord[] = response.ok
    ? (await response.json()).achievements || []
    : [];
  
  const unlockedAchievements: AchievementRecord[] = [];
  
  // 检查每个成就
  for (const achievement of ACHIEVEMENTS) {
    const existing = existingRecords.find((r) => r.achievementId === achievement.id);
    
    // 如果已经完成，跳过
    if (existing?.completed) {
      unlockedAchievements.push(existing);
      continue;
    }
    
    // 检查条件
    const { completed, progress } = checkAchievementCondition(
      achievement.condition,
      data
    );
    
    if (completed) {
      // 解锁新成就
      const record: AchievementRecord = {
        id: existing?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        childId,
        achievementId: achievement.id,
        unlockedAt: existing?.unlockedAt || new Date().toISOString(),
        progress,
        completed: true,
      };
      
      unlockedAchievements.push(record);
      
      // 如果是新解锁的，保存到服务器
      if (!existing) {
        await fetch("/api/achievements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record),
        }).catch(console.error);
      }
    } else if (progress > 0) {
      // 有进度但未完成，更新进度
      if (existing) {
        unlockedAchievements.push({
          ...existing,
          progress,
        });
      }
    }
  }
  
  return unlockedAchievements;
}

