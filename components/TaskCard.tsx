"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { DailyTaskItem, DailyTaskRule } from "@/types";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  rule: DailyTaskRule;
  taskItem?: DailyTaskItem;
  onToggle: (taskId: string) => void;
  onInput?: (taskId: string) => void;
}

export function TaskCard({
  rule,
  taskItem,
  onToggle,
  onInput,
}: TaskCardProps) {
  const isCompleted = taskItem?.completed || false;
  const stars = taskItem?.stars || 0;
  const count = taskItem?.count || 0;

  const handleClick = () => {
    if (rule.type === "input") {
      onInput?.(rule.id);
    } else {
      onToggle(rule.id);
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
                <h3 className="font-semibold">{rule.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {rule.description}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="gap-1">
                  {stars} ✨
                </Badge>
                {rule.type === "countable" && rule.maxCount && (
                  <Badge variant="outline">
                    {count}/{rule.maxCount}
                  </Badge>
                )}
                {rule.type === "input" && (
                  <Badge variant="outline">需要输入</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

