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
import { Switch } from "@/components/ui/switch";
// 不再直接使用 Supabase 客户端函数，改用 API 路由
import { DAILY_TASK_RULES } from "@/lib/rules";
import type { DailyTaskRule, Child } from "@/types";
import { Plus, Edit, Trash2, Settings, Save, X, Users } from "lucide-react";
import { AlertCircle } from "lucide-react";

export default function RulesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [rules, setRules] = useState<DailyTaskRule[]>([]);
  const [defaultRules, setDefaultRules] = useState<DailyTaskRule[]>(DAILY_TASK_RULES);
  const [isLoading, setIsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DailyTaskRule | null>(null);
  const [isNewRule, setIsNewRule] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    baseStars: 1,
    maxCount: undefined as number | undefined,
    type: "simple" as "simple" | "countable" | "input",
    enabled: true,
  });

  useEffect(() => {
    if (!session?.user?.id) {
      router.push("/auth/signin");
      return;
    }
    // 延迟加载，确保 session 已完全初始化
    const timer = setTimeout(() => {
      loadChildren();
    }, 100);
    return () => clearTimeout(timer);
  }, [session, router]);

  useEffect(() => {
    if (selectedChildId) {
      loadRules();
    } else {
      setRules([]);
    }
  }, [selectedChildId]);

  const loadChildren = async () => {
    if (!session?.user?.id) {
      console.error("没有用户ID，无法加载孩子列表");
      return;
    }
    
    try {
      console.log("正在加载孩子列表，用户ID:", session.user.id);
      
      // 使用 API 路由获取孩子列表（绕过 RLS）
      const response = await fetch("/api/children");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      const childrenList = result.children || [];
      
      console.log("获取到的孩子列表:", childrenList);
      setChildren(childrenList);
      
      // 如果有孩子，默认选择第一个
      if (childrenList.length > 0 && !selectedChildId) {
        setSelectedChildId(childrenList[0].id);
      }
    } catch (error) {
      console.error("加载孩子列表失败:", error);
      // 如果 API 获取失败，尝试从 localStorage 获取（兼容性处理）
      try {
        const { getChildren: getChildrenLocal } = await import("@/lib/children");
        const localChildren = getChildrenLocal();
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
    }
  };

  const loadRules = async () => {
    if (!selectedChildId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/task-rules?childId=${selectedChildId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setRules(result.rules || []);
    } catch (error) {
      console.error("加载规则失败:", error);
      setRules([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRule = () => {
    setIsNewRule(true);
    setEditingRule(null);
    setFormData({
      id: "",
      name: "",
      description: "",
      baseStars: 1,
      maxCount: undefined,
      type: "simple",
      enabled: true,
    });
    setEditDialogOpen(true);
  };

  const handleEditRule = (rule: DailyTaskRule) => {
    setIsNewRule(false);
    setEditingRule(rule);
    setFormData({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      baseStars: rule.baseStars,
      maxCount: rule.maxCount,
      type: rule.type,
      enabled: true,
    });
    setEditDialogOpen(true);
  };

  const handleSaveRule = async () => {
    if (!selectedChildId) {
      alert("请先选择孩子");
      return;
    }
    if (!formData.name || !formData.description) {
      alert("请填写规则名称和描述");
      return;
    }

    const ruleId = isNewRule
      ? `custom-${Date.now()}`
      : formData.id;

    const rule: DailyTaskRule = {
      id: ruleId,
      name: formData.name,
      description: formData.description,
      baseStars: formData.baseStars,
      maxCount: formData.maxCount,
      type: formData.type,
      // 注意：自定义规则暂时不支持复杂的 inputConfig
      // 如果需要，可以后续扩展
    };

    try {
      const response = await fetch("/api/task-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: selectedChildId, rule }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "保存失败");
      }

      setEditDialogOpen(false);
      loadRules();
    } catch (error: any) {
      console.error("保存规则失败:", error);
      alert(error.message || "保存失败，请重试");
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!selectedChildId) return;
    if (!confirm("确定要删除这条规则吗？")) return;

    try {
      const response = await fetch(`/api/task-rules?childId=${selectedChildId}&ruleId=${ruleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "删除失败");
      }

      loadRules();
    } catch (error: any) {
      console.error("删除规则失败:", error);
      alert(error.message || "删除失败，请重试");
    }
  };

  const handleImportDefault = async (defaultRule: DailyTaskRule) => {
    if (!selectedChildId) {
      alert("请先选择孩子");
      return;
    }
    
    try {
      const response = await fetch("/api/task-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: selectedChildId, rule: defaultRule }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "导入失败");
      }

      loadRules();
    } catch (error: any) {
      console.error("导入规则失败:", error);
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
            <Settings className="h-6 w-6" />
            <div>
              <h1 className="text-3xl font-bold">自定义摘星星规则</h1>
              <p className="text-muted-foreground">
                为每个孩子创建和管理专属任务规则
              </p>
            </div>
          </div>
          <Button 
            onClick={handleCreateRule} 
            className="gap-2"
            disabled={!selectedChildId}
          >
            <Plus className="h-4 w-4" />
            新建规则
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            选择孩子
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedChildId || ""}
            onValueChange={setSelectedChildId}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="选择要管理规则的孩子" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  <div className="flex items-center gap-2">
                    <span>{child.avatar}</span>
                    <span>{child.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedChild && (
            <p className="text-sm text-muted-foreground mt-2">
              正在管理 <span className="font-semibold">{selectedChild.name}</span> 的规则
            </p>
          )}
        </CardContent>
      </Card>

      {!selectedChildId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">请先选择孩子</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {children.length === 0 
                ? "还没有添加孩子，请先添加孩子" 
                : "请在上方选择要管理规则的孩子"}
            </p>
            {children.length === 0 && (
              <Button onClick={() => router.push("/children")}>
                前往添加孩子
              </Button>
            )}
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">加载中...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>我的自定义规则</CardTitle>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>还没有自定义规则</p>
                  <p className="text-sm mt-2">
                    点击"新建规则"创建，或从默认规则导入
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{rule.name}</h3>
                          <span className="text-sm text-muted-foreground">
                            ({rule.baseStars} ✨)
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                            {rule.type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {rule.description}
                        </p>
                        {rule.maxCount && (
                          <p className="text-xs text-muted-foreground mt-1">
                            每天最多 {rule.maxCount} 次
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditRule(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>默认规则库</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                可以从默认规则库中导入规则，然后进行自定义修改
              </p>
              <div className="space-y-3">
                {defaultRules.map((rule) => {
                  const isImported = rules.some((r) => r.id === rule.id);
                  return (
                    <div
                      key={rule.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{rule.name}</h3>
                          <span className="text-sm text-muted-foreground">
                            ({rule.baseStars} ✨)
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-muted rounded">
                            {rule.type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {rule.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={isImported ? "outline" : "default"}
                        disabled={isImported}
                        onClick={() => handleImportDefault(rule)}
                      >
                        {isImported ? "已导入" : "导入"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewRule ? "新建规则" : "编辑规则"}
            </DialogTitle>
            <DialogDescription>
              {isNewRule
                ? "创建一个新的摘星星规则"
                : "修改现有的规则"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>规则名称 *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="例如：准时启动奖"
              />
            </div>
            <div className="space-y-2">
              <Label>规则描述 *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="详细描述这个规则的内容和要求"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>基础星星数 *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.baseStars}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      baseStars: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>规则类型 *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "simple" | "countable" | "input") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">简单任务</SelectItem>
                    <SelectItem value="countable">可计数任务</SelectItem>
                    <SelectItem value="input">需要输入的任务</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.type === "countable" && (
              <div className="space-y-2">
                <Label>每天最大完成次数</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.maxCount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxCount: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="例如：3"
                />
              </div>
            )}
            {formData.type === "input" && (
              <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                注意：需要输入的任务类型需要更复杂的配置，当前版本暂不支持自定义输入任务。
                请使用"简单任务"或"可计数任务"类型。
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveRule} className="gap-2">
              <Save className="h-4 w-4" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

