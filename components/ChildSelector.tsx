"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getChildrenSync, getCurrentChild, setCurrentChildId } from "@/lib/children";
import type { Child } from "@/types";
import { STORAGE_KEYS } from "@/types";
import { useRouter } from "next/navigation";

interface ChildSelectorProps {
  onChildChange?: (child: Child | null) => void;
}

export function ChildSelector({ onChildChange }: ChildSelectorProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [currentChild, setCurrentChild] = useState<Child | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      // 先尝试从 localStorage 读取（快速显示）
      const allChildren = getChildrenSync();
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

      // 总是从 Supabase 同步最新数据（确保新增的孩子能显示）
      try {
        const response = await fetch("/api/children");
        if (response.ok) {
          const result = await response.json();
          const syncedChildren = result.children || [];
          
          // 更新 localStorage 缓存
          if (syncedChildren.length > 0) {
            localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(syncedChildren));
          }
          
          if (syncedChildren.length > 0) {
            setChildren(syncedChildren);
            const currentId = current?.id;
            if (currentId) {
              const syncedCurrent = syncedChildren.find((c: any) => c.id === currentId);
              if (syncedCurrent) {
                setCurrentChild(syncedCurrent);
              } else {
                // 如果当前选中的孩子在同步后的列表中不存在，选择第一个
                if (syncedChildren.length > 0) {
                  const { setCurrentChildId } = await import("@/lib/children");
                  setCurrentChildId(syncedChildren[0].id);
                  setCurrentChild(syncedChildren[0]);
                  requestAnimationFrame(() => {
                    onChildChange?.(syncedChildren[0]);
                  });
                }
              }
            } else if (syncedChildren.length > 0) {
              // 如果没有当前选中的孩子，选择第一个
              const { setCurrentChildId } = await import("@/lib/children");
              setCurrentChildId(syncedChildren[0].id);
              setCurrentChild(syncedChildren[0]);
              requestAnimationFrame(() => {
                onChildChange?.(syncedChildren[0]);
              });
            }
          }
        }
      } catch (error) {
        console.error("同步孩子列表失败:", error);
      }
    };
    
    // 初始加载
    loadData();
    
    // 监听storage变化（跨标签页同步）
    const handleStorageChange = (e: StorageEvent) => {
      // 只处理 children 相关的变化
      if (e.key === STORAGE_KEYS.CHILDREN || e.key === STORAGE_KEYS.CURRENT_CHILD) {
        loadData();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    // 定期刷新孩子列表（每3秒检查一次，确保新增的孩子能显示）
    const refreshInterval = setInterval(() => {
      loadData();
    }, 3000);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(refreshInterval);
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

  const handleOpenChange = (open: boolean) => {
    // 当下拉菜单打开时，刷新孩子列表（确保显示最新数据）
    if (open) {
      const loadData = async () => {
        try {
          const response = await fetch("/api/children");
          if (response.ok) {
            const result = await response.json();
            const syncedChildren = result.children || [];
            
            // 更新 localStorage 缓存
            if (syncedChildren.length > 0) {
              localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(syncedChildren));
              setChildren(syncedChildren);
            }
          }
        } catch (error) {
          console.error("刷新孩子列表失败:", error);
        }
      };
      loadData();
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
      onOpenChange={handleOpenChange}
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

