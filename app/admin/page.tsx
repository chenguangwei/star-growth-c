"use client";

import { useState } from "react";
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
  getChildren,
  updateChildStars,
  deleteChild,
} from "@/lib/children";
import {
  getAllDailyTaskRecords,
  getQuizRecords,
  getRewardExchanges,
  addOperationLog,
} from "@/lib/data";
import type { Child } from "@/types";
import { Lock, Users, Database, AlertTriangle, Settings, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

const ADMIN_PASSWORD = "admin123"; // 简单密码，实际应用中应该使用加密存储

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustStars, setAdjustStars] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      loadChildren();
    } else {
      alert("密码错误");
    }
  };

  const loadChildren = () => {
    setChildren(getChildren());
  };

  const handleAdjustStars = () => {
    if (!selectedChild || !adjustStars) return;

    const delta = parseInt(adjustStars);
    if (isNaN(delta)) {
      alert("请输入有效的数字");
      return;
    }

    const oldStars = selectedChild.totalStars;
    updateChildStars(selectedChild.id, delta);

    addOperationLog({
      childId: selectedChild.id,
      type: "manual_adjust",
      action: `手动调整星星：${delta > 0 ? "+" : ""}${delta}`,
      date: new Date().toISOString(),
      starsChange: delta,
      reason: adjustReason || "父母手动调整",
      operator: "管理员",
    });

    setAdjustDialogOpen(false);
    setAdjustStars("");
    setAdjustReason("");
    loadChildren();
    setSelectedChild(
      getChildren().find((c) => c.id === selectedChild.id) || null
    );
  };

  const handleDeleteChild = (child: Child) => {
    if (
      confirm(
        `确定要删除 ${child.name} 的档案吗？\n\n此操作不会删除历史记录，但会清除当前孩子的选中状态。`
      )
    ) {
      deleteChild(child.id);
      loadChildren();
    }
  };

  const handleDeception = (child: Child) => {
    if (confirm(`确定要扣除 ${child.name} 10个星星（欺骗行为）吗？`)) {
      updateChildStars(child.id, -10);

      addOperationLog({
        childId: child.id,
        type: "deception",
        action: "欺骗行为扣除",
        date: new Date().toISOString(),
        starsChange: -10,
        reason: "发现欺骗行为或虚假完成任务",
        operator: "管理员",
      });

      loadChildren();
      setSelectedChild(
        getChildren().find((c) => c.id === child.id) || null
      );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              父母管理后台
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">请输入管理密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
                placeholder="输入密码"
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              登录
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              提示：默认密码为 admin123
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getChildStats = (child: Child) => {
    const dailyRecords = getAllDailyTaskRecords(child.id);
    const quizRecords = getQuizRecords(child.id);
    const exchanges = getRewardExchanges(child.id);

    const totalEarned =
      dailyRecords.reduce((sum, r) => sum + r.totalStars, 0) +
      quizRecords.reduce((sum, r) => sum + r.rewardStars, 0);
    const exchanged = exchanges.reduce((sum, e) => sum + e.starsCost, 0);

    return {
      totalEarned,
      exchanged,
      available: totalEarned - exchanged,
      dailyCount: dailyRecords.length,
      quizCount: quizRecords.length,
      exchangeCount: exchanges.length,
    };
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">父母管理后台</h1>
            <p className="text-muted-foreground">
              管理孩子档案、调整数据、审核操作
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
            退出登录
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              孩子管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {children.map((child) => {
                const stats = getChildStats(child);
                return (
                  <div
                    key={child.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{child.avatar}</span>
                        <div>
                          <p className="font-semibold">{child.name}</p>
                          <p className="text-sm text-muted-foreground">
                            总星星：{child.totalStars} ✨
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedChild(child);
                            setAdjustDialogOpen(true);
                          }}
                        >
                          调整星星
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeception(child)}
                        >
                          欺骗-10
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteChild(child)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• 总获得：{stats.totalEarned} ✨</p>
                      <p>• 已兑换：{stats.exchanged} ✨</p>
                      <p>• 可用：{stats.available} ✨</p>
                      <p>
                        • 记录：{stats.dailyCount} 天任务，{stats.quizCount} 次测验
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              数据概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">孩子总数</p>
                <p className="text-2xl font-bold">{children.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  所有孩子总星星
                </p>
                <p className="text-2xl font-bold">
                  {children.reduce((sum, c) => sum + c.totalStars, 0)} ✨
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            重要提示
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="font-semibold mb-1">数据管理</p>
            <p className="text-muted-foreground">
              • 手动调整星星会记录操作日志
              <br />• 欺骗行为扣除会记录原因
              <br />• 删除孩子不会删除历史数据
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="font-semibold mb-1">注意事项</p>
            <p className="text-muted-foreground">
              • 所有操作都会留下记录
              <br />• 请谨慎操作，避免误操作
              <br />• 建议定期备份数据（导出功能待开发）
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>调整星星数</DialogTitle>
            <DialogDescription>
              为 {selectedChild?.name} 调整星星数（可为正数或负数）
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>调整数量</Label>
              <Input
                type="number"
                value={adjustStars}
                onChange={(e) => setAdjustStars(e.target.value)}
                placeholder="例如：+10 或 -5"
              />
            </div>
            <div className="space-y-2">
              <Label>调整原因（可选）</Label>
              <Input
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="记录调整原因"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAdjustStars}>确认调整</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

