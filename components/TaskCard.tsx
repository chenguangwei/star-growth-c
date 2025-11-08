"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { DailyTaskItem, DailyTaskRule } from "@/types";
import { CheckCircle2, Circle, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  rule: DailyTaskRule;
  taskItem?: DailyTaskItem;
  onToggle: (taskId: string) => void;
  onInput?: (taskId: string) => void;
  onQuality?: (taskId: string) => void; // 质量评估回调（新增）
  onDecrease?: (taskId: string) => void; // 减少计数回调（新增）
}

export function TaskCard({
  rule,
  taskItem,
  onToggle,
  onInput,
  onQuality,
  onDecrease,
}: TaskCardProps) {
  const isCompleted = taskItem?.completed || false;
  const stars = taskItem?.stars || 0;
  const count = taskItem?.count || 0;
  
  // 获取当前等级
  const currentLevel = rule.gamification?.levels?.find(
    (level) => count >= level.count
  );
  const nextLevel = rule.gamification?.levels?.find(
    (level) => count < level.count
  );

  const handleClick = () => {
    if (rule.type === "input") {
      onInput?.(rule.id);
    } else if (rule.type === "countable") {
      const maxCount = rule.maxCount || Infinity;
      const isAtMax = count >= maxCount;
      
      if (isAtMax) {
        // 已达到上限，点击移除最后一次记录
        onToggle(rule.id);
      } else if (rule.countableConfig?.qualityEnabled) {
        // 未达到上限且启用质量评估，弹出质量对话框
        onQuality?.(rule.id);
      } else {
        // 未达到上限且未启用质量评估，直接添加计数
        onToggle(rule.id);
      }
    } else {
      // simple类型任务
      onToggle(rule.id);
    }
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发handleClick
    if (count > 0) {
      onDecrease?.(rule.id);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "card-glow cursor-pointer transition-all",
          isCompleted
            ? "border-primary bg-primary/5"
            : "hover:border-primary/50"
        )}
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                {/* 显示emoji（如果规则名称中没有） */}
                {rule.gamification?.emoji && !rule.name.includes(rule.gamification.emoji) && (
                  <span className="text-xl">{rule.gamification.emoji}</span>
                )}
                <h3 className="font-semibold">{rule.name}</h3>
                {/* 显示当前等级徽章 */}
                {currentLevel && (
                  <Badge variant="default" className="ml-auto">
                    {currentLevel.badge} {currentLevel.name}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {rule.description}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="gap-1">
                  {stars} ✨
                </Badge>
                {rule.type === "countable" && rule.maxCount && (
                  <>
                    <Badge variant="outline">
                      {count}/{rule.maxCount}
                    </Badge>
                    {/* 显示进度条 */}
                    {rule.maxCount > 0 && (
                      <div className="flex-1 min-w-[60px] h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min((count / rule.maxCount) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                    {/* 减少按钮（当有计数时显示） */}
                    {count > 0 && onDecrease && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleDecrease}
                        title="减少一次"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
                {rule.type === "input" && (
                  <Badge variant="outline">需要输入</Badge>
                )}
                {/* 显示难度标签 */}
                {rule.gamification?.difficulty && (
                  <Badge variant="outline" className="text-xs">
                    {rule.gamification.difficulty}
                  </Badge>
                )}
              </div>
              {/* 显示详细记录信息 */}
              {taskItem?.countDetails && taskItem.countDetails.length > 0 && (
                <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                  今日完成 {taskItem.countDetails.length} 次
                  {taskItem.countDetails.some((d) => d.quality === 3) && (
                    <span className="ml-2 text-primary">⭐ 有优秀表现</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

