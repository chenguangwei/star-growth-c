"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChildCard } from "@/components/ChildCard";
import { setCurrentChildId, getCurrentChildId } from "@/lib/children";
import type { Child } from "@/types";
import { Plus, Users, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const EMOJI_OPTIONS = [
  "👧", "👦", "🧒", "👶", "👸", "🤴",
  "🌟", "⭐", "✨", "💫", "🎀", "🎁",
  "🐰", "🐱", "🐶", "🦊", "🐼", "🐨",
  "🌸", "🌺", "🌻", "🌷", "🌹", "🌼",
];

export default function ChildrenPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [currentChildId, setCurrentChildIdState] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [formData, setFormData] = useState({ name: "", avatar: "👧" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) {
      router.push("/auth/signin");
      return;
    }
    loadChildren();
  }, [session, router]);

  const loadChildren = async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/children");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      const childrenList = result.children || [];
      setChildren(childrenList);
      
      // 加载当前选中的孩子ID
      const currentId = getCurrentChildId();
      setCurrentChildIdState(currentId);
    } catch (error) {
      console.error("加载孩子列表失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingChild(null);
    setFormData({ name: "", avatar: "👧" });
    setIsDialogOpen(true);
  };

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    setFormData({ name: child.name, avatar: child.avatar });
    setIsDialogOpen(true);
  };

  const handleDelete = async (child: Child) => {
    if (!confirm(`确定要删除 ${child.name} 的档案吗？\n\n注意：此操作不会删除历史记录。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/children?id=${child.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "删除失败");
      }

      // 如果删除的是当前选中的孩子，清除选择
      if (currentChildId === child.id) {
        setCurrentChildId(null);
        setCurrentChildIdState(null);
      }

      loadChildren();
    } catch (error: any) {
      console.error("删除失败:", error);
      alert(error.message || "删除失败，请重试");
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("请输入孩子姓名");
      return;
    }

    if (!session?.user?.id) {
      alert("请先登录");
      return;
    }

    setIsSaving(true);
    try {
      if (editingChild) {
        // 更新孩子
        const response = await fetch("/api/children", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingChild.id,
            name: formData.name.trim(),
            avatar: formData.avatar,
          }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "更新失败");
        }
      } else {
        // 添加孩子
        const response = await fetch("/api/children", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name.trim(),
            avatar: formData.avatar,
          }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "添加失败");
        }

        const result = await response.json();
        // 如果这是第一个孩子，自动设为当前孩子
        if (children.length === 0 && result.child) {
          setCurrentChildId(result.child.id);
          setCurrentChildIdState(result.child.id);
        }
      }

      setIsDialogOpen(false);
      loadChildren();
    } catch (error: any) {
      console.error("保存失败:", error);
      alert(error.message || "保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelect = (child: Child) => {
    setCurrentChildId(child.id);
    setCurrentChildIdState(child.id);
    router.push("/");
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-6 w-6" />
          <h1 className="text-3xl font-bold">孩子管理</h1>
        </div>
        <p className="text-muted-foreground">
          添加和管理孩子的档案，每个孩子的数据完全独立
        </p>
      </div>

      <div className="mb-6">
        <Button onClick={handleAdd} className="gap-2" disabled={isLoading}>
          <Plus className="h-4 w-4" />
          添加孩子
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">加载中...</p>
          </CardContent>
        </Card>
      ) : children.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">还没有添加孩子</h3>
            <p className="text-muted-foreground mb-4 text-center">
              点击上方按钮添加第一个孩子的档案
            </p>
            <Button onClick={handleAdd}>添加孩子</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              isSelected={child.id === currentChildId}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onDelete={handleDelete}
              showActions={true}
            />
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingChild ? "编辑孩子信息" : "添加新孩子"}
            </DialogTitle>
            <DialogDescription>
              {editingChild
                ? "修改孩子的姓名和头像"
                : "创建新的孩子档案"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">孩子姓名</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="请输入孩子姓名"
              />
            </div>
            <div className="space-y-2">
              <Label>选择头像</Label>
              <div className="grid grid-cols-8 gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, avatar: emoji })
                    }
                    className={`text-3xl p-2 rounded-lg transition-all ${
                      formData.avatar === emoji
                        ? "ring-2 ring-primary bg-primary/10"
                        : "hover:bg-muted"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

