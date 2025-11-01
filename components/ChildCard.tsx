"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Child } from "@/types";
import { motion } from "framer-motion";

interface ChildCardProps {
  child: Child;
  isSelected?: boolean;
  onSelect?: (child: Child) => void;
  onEdit?: (child: Child) => void;
  onDelete?: (child: Child) => void;
  showActions?: boolean;
}

export function ChildCard({
  child,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  showActions = false,
}: ChildCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`card-glow cursor-pointer transition-all ${
          isSelected
            ? "ring-2 ring-primary border-primary"
            : "hover:border-primary/50"
        }`}
        onClick={() => onSelect?.(child)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{child.avatar}</div>
              <div>
                <h3 className="text-lg font-semibold">{child.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(child.createdAt).toLocaleDateString("zh-CN")}
                </p>
              </div>
            </div>
            {showActions && (
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit?.(child)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete?.(child)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">总星星数</span>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-yellow-500">
                {child.totalStars}
              </span>
              <span className="text-yellow-500">✨</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

