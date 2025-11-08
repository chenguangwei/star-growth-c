import type { Child } from "@/types";
import { STORAGE_KEYS } from "@/types";

// 获取所有孩子（混合存储：优先从 localStorage，如果没有则从 Supabase 同步）
export async function getChildren(): Promise<Child[]> {
  if (typeof window === "undefined") return [];
  
  // 先尝试从 localStorage 读取
  const localData = localStorage.getItem(STORAGE_KEYS.CHILDREN);
  if (localData) {
    try {
      const children = JSON.parse(localData) as Child[];
      if (children.length > 0) {
        return children;
      }
    } catch {
      // 如果解析失败，继续从 Supabase 读取
    }
  }
  
  // 如果 localStorage 没有数据，从 Supabase 读取并缓存
  try {
    const response = await fetch("/api/children");
    if (response.ok) {
      const result = await response.json();
      const children = result.children || [];
      // 缓存到 localStorage
      if (children.length > 0) {
        localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children));
      }
      return children;
    }
  } catch (error) {
    console.error("从 Supabase 获取孩子列表失败:", error);
  }
  
  return [];
}

// 同步版本（用于向后兼容）
export function getChildrenSync(): Child[] {
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
  const children = getChildrenSync();
  return children.find((child) => child.id === id) || null;
}

// 添加孩子（同时写入 Supabase 和 localStorage）
export async function addChild(child: Omit<Child, "id" | "createdAt" | "totalStars">): Promise<Child> {
  // 先保存到 Supabase
  try {
    const response = await fetch("/api/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: child.name,
        avatar: child.avatar,
      }),
    });

    if (!response.ok) {
      throw new Error("保存到 Supabase 失败");
    }

    const result = await response.json();
    const newChild = result.child;

    // 同步到 localStorage
    const children = getChildrenSync();
    children.push(newChild);
    localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children));

    return newChild;
  } catch (error) {
    console.error("添加孩子失败:", error);
    // 如果 Supabase 失败，仍然保存到 localStorage（降级处理）
    const children = getChildrenSync();
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
}

// 更新孩子信息（同时更新 Supabase 和 localStorage）
export async function updateChild(id: string, updates: Partial<Omit<Child, "id" | "createdAt">>): Promise<Child | null> {
  // 先更新到 Supabase
  try {
    const children = getChildrenSync();
    const child = children.find((c) => c.id === id);
    if (!child) return null;

    const response = await fetch("/api/children", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name: updates.name || child.name,
        avatar: updates.avatar || child.avatar,
      }),
    });

    if (!response.ok) {
      throw new Error("更新到 Supabase 失败");
    }

    const result = await response.json();
    const updatedChild = result.child;

    // 同步到 localStorage
    const index = children.findIndex((c) => c.id === id);
    if (index >= 0) {
      children[index] = updatedChild;
      localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children));
    }

    return updatedChild;
  } catch (error) {
    console.error("更新孩子失败:", error);
    // 如果 Supabase 失败，仍然更新 localStorage（降级处理）
    const children = getChildrenSync();
    const index = children.findIndex((child) => child.id === id);
    if (index === -1) return null;
    children[index] = { ...children[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children));
    return children[index];
  }
}

// 删除孩子（同时从 Supabase 和 localStorage 删除）
export async function deleteChild(id: string): Promise<boolean> {
  // 先从 Supabase 删除
  try {
    const response = await fetch(`/api/children?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("从 Supabase 删除失败");
    }
  } catch (error) {
    console.error("删除孩子失败:", error);
    // 即使 Supabase 失败，也继续从 localStorage 删除（降级处理）
  }

  // 从 localStorage 删除
  const children = getChildrenSync();
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

// 获取当前选中的孩子（同步版本）
export function getCurrentChild(): Child | null {
  const id = getCurrentChildId();
  if (!id) return null;
  
  return getChildById(id);
}

// 获取当前选中的孩子（异步版本，会从 Supabase 同步）
export async function getCurrentChildAsync(): Promise<Child | null> {
  const id = getCurrentChildId();
  if (!id) return null;
  
  const children = await getChildren();
  return children.find((child) => child.id === id) || null;
}

// 更新孩子的星星总数（同时更新 Supabase 和 localStorage）
export async function updateChildStars(id: string, delta: number): Promise<void> {
  const child = getChildById(id);
  if (!child) return;
  
  const newTotalStars = Math.max(0, child.totalStars + delta);
  
  // 先更新到 Supabase（通过更新孩子信息）
  try {
    await updateChild(id, {
      totalStars: newTotalStars,
    });
  } catch (error) {
    console.error("更新孩子星星总数到 Supabase 失败:", error);
    // 如果 Supabase 失败，仍然更新 localStorage（降级处理）
    const children = getChildrenSync();
    const index = children.findIndex((c) => c.id === id);
    if (index >= 0) {
      children[index].totalStars = newTotalStars;
      localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children));
    }
  }
}

// 同步版本（用于向后兼容，仅更新 localStorage）
export function updateChildStarsSync(id: string, delta: number): void {
  const child = getChildById(id);
  if (!child) return;
  
  const children = getChildrenSync();
  const index = children.findIndex((c) => c.id === id);
  if (index >= 0) {
    children[index].totalStars = Math.max(0, child.totalStars + delta);
    localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children));
  }
}

