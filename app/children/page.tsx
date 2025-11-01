"use client";

import { useState, useEffect } from "react";
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
import {
  getChildren,
  addChild,
  updateChild,
  deleteChild,
  setCurrentChildId,
  getCurrentChildId,
} from "@/lib/children";
import type { Child } from "@/types";
import { Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";

const EMOJI_OPTIONS = [
  "👧", "👦", "🧒", "👶", "👸", "🤴",
  "🌟", "⭐", "✨", "💫", "🎀", "🎁",
  "🐰", "🐱", "🐶", "🦊", "🐼", "🐨",
  "🌸", "🌺", "🌻", "🌷", "🌹", "🌼",
];

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [currentChildId, setCurrentChildIdState] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [formData, setFormData] = useState({ name: "", avatar: "👧" });
  const router = useRouter();

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = () => {
    const allChildren = getChildren();
    setChildren(allChildren);
    setCurrentChildIdState(getCurrentChildId());
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

  const handleDelete = (child: Child) => {
    if (confirm(`确定要删除 ${child.name} 的档案吗？\n\n注意：此操作不会删除历史记录。`)) {
      deleteChild(child.id);
      loadChildren();
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert("请输入孩子姓名");
      return;
    }

    if (editingChild) {
      updateChild(editingChild.id, {
        name: formData.name.trim(),
        avatar: formData.avatar,
      });
    } else {
      const newChild = addChild({
        name: formData.name.trim(),
        avatar: formData.avatar,
      });
      // 如果这是第一个孩子，自动设为当前孩子
      if (children.length === 0) {
        setCurrentChildId(newChild.id);
      }
    }

    setIsDialogOpen(false);
    loadChildren();
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
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          添加孩子
        </Button>
      </div>

      {children.length === 0 ? (
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

