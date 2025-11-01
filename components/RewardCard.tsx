"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { Reward } from "@/types";
import { StarDisplay } from "@/components/StarDisplay";
import { Gift } from "lucide-react";

interface RewardCardProps {
  reward: Reward;
  availableStars: number;
  onExchange?: (reward: Reward) => void;
  disabled?: boolean;
}

export function RewardCard({
  reward,
  availableStars,
  onExchange,
  disabled = false,
}: RewardCardProps) {
  const canAfford = availableStars >= reward.starsCost;
  const isDisabled = disabled || !canAfford;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`card-glow overflow-hidden ${
          isDisabled ? "opacity-60" : ""
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{reward.name}</CardTitle>
              {reward.description && (
                <p className="text-sm text-muted-foreground">
                  {reward.description}
                </p>
              )}
            </div>
            {reward.category && (
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                {reward.category}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <StarDisplay count={reward.starsCost} size="sm" />
            </div>
            <Button
              onClick={() => onExchange?.(reward)}
              disabled={isDisabled}
              className="gap-2"
            >
              兑换
            </Button>
          </div>
          {!canAfford && (
            <p className="text-xs text-muted-foreground mt-2">
              还需要 {reward.starsCost - availableStars} 个星星
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

