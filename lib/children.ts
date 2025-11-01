import type { Child } from "@/types";
import { STORAGE_KEYS } from "@/types";

// 获取所有孩子
export function getChildren(): Child[] {
  if (typeof window === "undefined") return [];
  
  const data = localStorage.getItem(STORAGE_KEYS.CHILDREN);
  if (!data) return [];
  
  try {
    return JSON.parse(data) as Child[];
  } catch {
    return [];
  }
}

// 根据ID获取孩子
export function getChildById(id: string): Child | null {
  const children = getChildren();
  return children.find((child) => child.id === id) || null;
}

// 添加孩子
export function addChild(child: Omit<Child, "id" | "createdAt" | "totalStars">): Child {
  const children = getChildren();
  const newChild: Child = {
    ...child,
    id: `child-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    totalStars: 0,
  };
  
  children.push(newChild);
  localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children));
  
  return newChild;
}

// 更新孩子信息
export function updateChild(id: string, updates: Partial<Omit<Child, "id" | "createdAt">>): Child | null {
  const children = getChildren();
  const index = children.findIndex((child) => child.id === id);
  
  if (index === -1) return null;
  
  children[index] = { ...children[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children));
  
  return children[index];
}

// 删除孩子
export function deleteChild(id: string): boolean {
  const children = getChildren();
  const filtered = children.filter((child) => child.id !== id);
  
  if (filtered.length === children.length) return false;
  
  localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(filtered));
  
  // 如果删除的是当前选中的孩子，清除当前选中
  const currentChildId = getCurrentChildId();
  if (currentChildId === id) {
    setCurrentChildId(null);
  }
  
  return true;
}

// 获取当前选中的孩子ID
export function getCurrentChildId(): string | null {
  if (typeof window === "undefined") return null;
  
  const id = localStorage.getItem(STORAGE_KEYS.CURRENT_CHILD);
  return id || null;
}

// 设置当前选中的孩子ID
export function setCurrentChildId(id: string | null): void {
  if (typeof window === "undefined") return;
  
  if (id) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CHILD, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_CHILD);
  }
}

// 获取当前选中的孩子
export function getCurrentChild(): Child | null {
  const id = getCurrentChildId();
  if (!id) return null;
  
  return getChildById(id);
}

// 更新孩子的星星总数
export function updateChildStars(id: string, delta: number): void {
  const child = getChildById(id);
  if (!child) return;
  
  updateChild(id, {
    totalStars: Math.max(0, child.totalStars + delta),
  });
}

