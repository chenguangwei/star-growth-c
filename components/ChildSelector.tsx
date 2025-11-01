"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getChildren, getCurrentChild, setCurrentChildId } from "@/lib/children";
import type { Child } from "@/types";
import { useRouter } from "next/navigation";

interface ChildSelectorProps {
  onChildChange?: (child: Child | null) => void;
}

export function ChildSelector({ onChildChange }: ChildSelectorProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [currentChild, setCurrentChild] = useState<Child | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadData = () => {
      const allChildren = getChildren();
      setChildren(allChildren);
      
      const current = getCurrentChild();
      setCurrentChild((prev) => {
        // 只在孩子ID变化时更新并通知父组件
        if (current?.id !== prev?.id) {
          // 使用 requestAnimationFrame 避免在渲染期间调用
          requestAnimationFrame(() => {
            onChildChange?.(current);
          });
          return current;
        }
        return prev;
      });
    };
    
    // 初始加载
    loadData();
    
    // 监听storage变化（跨标签页同步）
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时执行一次

  const handleChange = (childId: string) => {
    const child = children.find((c) => c.id === childId) || null;
    if (child && child.id !== currentChild?.id) {
      setCurrentChildId(childId);
      setCurrentChild(child);
      // 使用 requestAnimationFrame 避免在渲染期间调用
      requestAnimationFrame(() => {
        onChildChange?.(child);
      });
    }
  };

  if (children.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        还没有添加孩子，请先添加
      </div>
    );
  }

  return (
    <Select
      value={currentChild?.id || ""}
      onValueChange={handleChange}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="选择孩子">
          {currentChild && (
            <div className="flex items-center gap-2">
              <span>{currentChild.avatar}</span>
              <span>{currentChild.name}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {children.map((child) => (
          <SelectItem key={child.id} value={child.id}>
            <div className="flex items-center gap-2">
              <span>{child.avatar}</span>
              <span>{child.name}</span>
              <span className="text-muted-foreground ml-auto">
                {child.totalStars} ✨
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

