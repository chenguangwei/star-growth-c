"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_REWARDS } from "@/lib/rules";
import type { Reward, Child } from "@/types";
import { Plus, Edit, Trash2, Gift, Users, ArrowLeft } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { ChildSelector } from "@/components/ChildSelector";

export default function RewardsManagePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [defaultRewards, setDefaultRewards] = useState<Reward[]>(DEFAULT_REWARDS);
  const [isLoading, setIsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [isNewReward, setIsNewReward] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    starsCost: 10,
    category: "",
  });

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      loadRewards();
    }
  }, [selectedChildId]);

  const loadChildren = async () => {
    try {
      const response = await fetch("/api/children");
      if (!response.ok) {
        throw new Error("加载孩子列表失败");
      }
      const result = await response.json();
      const childrenList = result.children || [];
      setChildren(childrenList);
      
      // 如果有孩子，默认选择第一个
      if (childrenList.length > 0 && !selectedChildId) {
        setSelectedChildId(childrenList[0].id);
      }
    } catch (error) {
      console.error("加载孩子列表失败:", error);
      // 如果 API 获取失败，尝试从 localStorage 获取（兼容性处理）
      try {
        const { getChildrenSync } = await import("@/lib/children");
        const localChildren = getChildrenSync();
        console.log("从 localStorage 获取的孩子列表:", localChildren);
        if (localChildren.length > 0) {
          setChildren(localChildren);
          if (!selectedChildId) {
            setSelectedChildId(localChildren[0].id);
          }
        }
      } catch (localError) {
        console.error("从 localStorage 获取孩子列表也失败:", localError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadRewards = async () => {
    if (!selectedChildId) return;

    try {
      const response = await fetch(`/api/rewards?childId=${selectedChildId}`);
      if (!response.ok) {
        throw new Error("加载奖励列表失败");
      }
      const result = await response.json();
      setRewards(result.rewards || []);
    } catch (error) {
      console.error("加载奖励列表失败:", error);
      setRewards([]);
    }
  };

  const handleNewReward = () => {
    setIsNewReward(true);
    setEditingReward(null);
    setFormData({
      id: "",
      name: "",
      description: "",
      starsCost: 10,
      category: "",
    });
    setEditDialogOpen(true);
  };

  const handleEditReward = (reward: Reward) => {
    setIsNewReward(false);
    setEditingReward(reward);
    setFormData({
      id: reward.id,
      name: reward.name,
      description: reward.description || "",
      starsCost: reward.starsCost,
      category: reward.category || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveReward = async () => {
    if (!selectedChildId) {
      alert("请先选择孩子");
      return;
    }
    if (!formData.name || !formData.starsCost) {
      alert("请填写奖励名称和所需星星数");
      return;
    }

    const rewardId = isNewReward
      ? `custom-${Date.now()}`
      : formData.id;

    const reward: Reward = {
      id: rewardId,
      name: formData.name,
      description: formData.description,
      starsCost: formData.starsCost,
      category: formData.category || undefined,
    };

    try {
      const response = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: selectedChildId, reward }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "保存失败");
      }

      setEditDialogOpen(false);
      loadRewards();
    } catch (error: any) {
      console.error("保存奖励失败:", error);
      alert(error.message || "保存失败，请重试");
    }
  };

  const handleDeleteReward = async (rewardId: string) => {
    if (!selectedChildId) return;
    if (!confirm("确定要删除这个奖励吗？")) return;

    try {
      const response = await fetch(`/api/rewards?childId=${selectedChildId}&rewardId=${rewardId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "删除失败");
      }

      loadRewards();
    } catch (error: any) {
      console.error("删除奖励失败:", error);
      alert(error.message || "删除失败，请重试");
    }
  };

  const handleImportDefault = async (defaultReward: Reward) => {
    if (!selectedChildId) {
      alert("请先选择孩子");
      return;
    }
    
    try {
      const response = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: selectedChildId, reward: defaultReward }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "导入失败");
      }

      loadRewards();
    } catch (error: any) {
      console.error("导入奖励失败:", error);
      alert(error.message || "导入失败，请重试");
    }
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">请先登录</h3>
            <Button onClick={() => router.push("/auth/signin")}>
              前往登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">请先添加孩子</h3>
            <Button onClick={() => router.push("/children")}>
              前往添加孩子
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedChild = children.find((c) => c.id === selectedChildId);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/rewards")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Gift className="h-6 w-6" />
            <h1 className="text-3xl font-bold">奖励管理</h1>
          </div>
          <Button onClick={handleNewReward}>
            <Plus className="h-4 w-4 mr-2" />
            新增奖励
          </Button>
        </div>
        <p className="text-muted-foreground mt-2">
          为 {selectedChild?.name || "孩子"} 管理自定义奖励列表
        </p>
      </div>

      <div className="mb-6">
        <Label className="mb-2 block">选择孩子</Label>
        <ChildSelector
          children={children}
          currentChildId={selectedChildId}
          onChildChange={(childId) => setSelectedChildId(childId)}
        />
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">自定义奖励</h2>
        {rewards.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Gift className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">还没有自定义奖励</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => (
              <Card key={reward.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{reward.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditReward(reward)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteReward(reward.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {reward.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {reward.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {reward.starsCost} ✨
                    </span>
                    {reward.category && (
                      <span className="text-xs text-muted-foreground">
                        {reward.category}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">默认奖励（可导入）</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {defaultRewards.map((reward) => {
            const isImported = rewards.some((r) => r.id === reward.id);
            return (
              <Card key={reward.id} className={isImported ? "opacity-50" : ""}>
                <CardHeader>
                  <CardTitle className="text-lg">{reward.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {reward.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {reward.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {reward.starsCost} ✨
                    </span>
                    {reward.category && (
                      <span className="text-xs text-muted-foreground">
                        {reward.category}
                      </span>
                    )}
                  </div>
                  {!isImported && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleImportDefault(reward)}
                    >
                      导入
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isNewReward ? "新增奖励" : "编辑奖励"}
            </DialogTitle>
            <DialogDescription>
              {isNewReward
                ? "创建一个新的自定义奖励"
                : "修改奖励信息"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">奖励名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="例如：视频时间券"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">奖励描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="例如：兑换30分钟自由支配的视频时间"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="starsCost">所需星星数 *</Label>
              <Input
                id="starsCost"
                type="number"
                min="1"
                value={formData.starsCost}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    starsCost: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">分类</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="娱乐">娱乐</SelectItem>
                  <SelectItem value="购物">购物</SelectItem>
                  <SelectItem value="学习">学习</SelectItem>
                  <SelectItem value="其他">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleSaveReward}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

