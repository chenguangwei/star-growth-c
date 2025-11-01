"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface StarDisplayProps {
  count: number;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-6xl",
};

export function StarDisplay({
  count,
  size = "md",
  showLabel = false,
  animated = false,
  className = "",
}: StarDisplayProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {animated ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
          }}
          className="flex items-center gap-1"
        >
          <span className={`font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 bg-clip-text text-transparent ${sizeClasses[size]}`}>
            {count.toLocaleString()}
          </span>
          <Sparkles className={`text-yellow-500 ${size === "xl" ? "h-8 w-8" : size === "lg" ? "h-6 w-6" : "h-5 w-5"}`} />
        </motion.div>
      ) : (
        <div className="flex items-center gap-1">
          <span className={`font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 bg-clip-text text-transparent ${sizeClasses[size]}`}>
            {count.toLocaleString()}
          </span>
          <span className={`text-yellow-500 ${sizeClasses[size]}`}>✨</span>
        </div>
      )}
      {showLabel && (
        <span className="text-sm text-muted-foreground">星星</span>
      )}
    </div>
  );
}

