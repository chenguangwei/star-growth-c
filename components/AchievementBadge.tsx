"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { Achievement, AchievementRecord } from "@/types";
import { Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  achievement: Achievement;
  record?: AchievementRecord;
  showProgress?: boolean;
}

export function AchievementBadge({
  achievement,
  record,
  showProgress = false,
}: AchievementBadgeProps) {
  const isUnlocked = record?.completed || false;
  const progress = record?.progress || 0;
  
  // 根据稀有度设置样式
  const rarityStyles = {
    common: "border-gray-300 bg-gray-50 dark:bg-gray-900",
    rare: "border-blue-300 bg-blue-50 dark:bg-blue-900/20",
    epic: "border-purple-300 bg-purple-50 dark:bg-purple-900/20",
    legendary: "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
  };
  
  const rarityColors = {
    common: "text-gray-600",
    rare: "text-blue-600",
    epic: "text-purple-600",
    legendary: "text-yellow-600",
  };
  
  // 获取条件值
  const targetValue = achievement.condition.value;
  const progressPercent = targetValue > 0 ? Math.min((progress / targetValue) * 100, 100) : 0;
  
  return (
    <motion.div
      whileHover={isUnlocked ? { scale: 1.05 } : {}}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "transition-all relative overflow-hidden",
          isUnlocked
            ? rarityStyles[achievement.rarity]
            : "border-gray-200 bg-gray-50/50 dark:bg-gray-900/50 opacity-60"
        )}
      >
        {isUnlocked && (
          <div className="absolute top-2 right-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
        )}
        
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Emoji图标 */}
            <div className="text-4xl">{achievement.emoji}</div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={cn(
                  "font-semibold text-sm",
                  isUnlocked ? rarityColors[achievement.rarity] : "text-muted-foreground"
                )}>
                  {achievement.name}
                </h3>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    isUnlocked ? rarityColors[achievement.rarity] : ""
                  )}
                >
                  {achievement.rarity === "common" && "普通"}
                  {achievement.rarity === "rare" && "稀有"}
                  {achievement.rarity === "epic" && "史诗"}
                  {achievement.rarity === "legendary" && "传说"}
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground mb-2">
                {achievement.description}
              </p>
              
              {/* 进度条 */}
              {showProgress && !isUnlocked && progress > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>进度</span>
                    <span>{progress} / {targetValue}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all",
                        rarityColors[achievement.rarity].replace("text-", "bg-")
                      )}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* 奖励星星 */}
              {isUnlocked && achievement.rewardStars && (
                <div className="mt-2 text-xs text-muted-foreground">
                  奖励: +{achievement.rewardStars} ✨
                </div>
              )}
              
              {/* 未解锁提示 */}
              {!isUnlocked && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>未解锁</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

