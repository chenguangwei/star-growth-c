"use client";

import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/TaskCard";
import { QualityDialog } from "@/components/QualityDialog";
import { StarDisplay } from "@/components/StarDisplay";
import { Progress } from "@/components/ui/progress";
import { addCountableTaskCompletion, removeCountableTaskCompletion } from "@/lib/countable-tasks";
import {
  getCurrentChild,
  getChildrenSync,
} from "@/lib/children";
import {
  getDailyTaskRecordSync,
  saveDailyTaskRecord,
  getTodayDate,
} from "@/lib/data";
import {
  getChildTaskRules,
  DAILY_TASK_RULES,
} from "@/lib/rules";
import type {
  DailyTaskRecord,
  DailyTaskItem,
  DailyTaskRule,
} from "@/types";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TasksPage() {
  const router = useRouter();
  const [currentChild, setCurrentChild] = useState(getCurrentChild());
  const [todayRecord, setTodayRecord] = useState<DailyTaskRecord | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [inputDialogOpen, setInputDialogOpen] = useState(false);
  const [inputTaskId, setInputTaskId] = useState<string | null>(null);
  const [inputData, setInputData] = useState<Record<string, any>>({});
  const [taskRules, setTaskRules] = useState<DailyTaskRule[]>(DAILY_TASK_RULES);
  const [qualityDialogOpen, setQualityDialogOpen] = useState(false);
  const [qualityTaskId, setQualityTaskId] = useState<string | null>(null);

  useEffect(() => {
    const loadChild = async () => {
      // 先尝试从 localStorage 获取（快速）
      let child = getCurrentChild();
      
      if (!child) {
        // 如果 localStorage 没有当前孩子，尝试从 Supabase 同步
        let children = getChildrenSync();
        
        // 如果 localStorage 没有数据，从 Supabase 加载
        if (children.length === 0) {
          try {
            const { getChildren } = await import("@/lib/children");
            children = await getChildren();
          } catch (error) {
            console.error("加载孩子列表失败:", error);
          }
        }
        
        if (children.length === 0) {
          router.push("/children");
          return;
        }
        
        // 如果有孩子但没有选中，选择第一个
        const { setCurrentChildId } = await import("@/lib/children");
        setCurrentChildId(children[0].id);
        child = children[0];
      }
      
      setCurrentChild(child);
    };
    
    loadChild();
  }, [router]);

  useEffect(() => {
    if (currentChild) {
      loadTaskRules();
      loadRecordForDate(selectedDate);
    }
  }, [currentChild, selectedDate]);

  const loadTaskRules = async () => {
    if (!currentChild) return;
    
    try {
      const rules = await getChildTaskRules(currentChild.id);
      setTaskRules(rules);
    } catch (error) {
      console.error("加载任务规则失败:", error);
      // 如果加载失败，使用默认规则
      setTaskRules(DAILY_TASK_RULES);
    }
  };

  const loadRecordForDate = async (date: string) => {
    if (!currentChild) return;
    // 先尝试从 localStorage 读取（快速）
    let record = getDailyTaskRecordSync(currentChild.id, date);
    
    // 如果 localStorage 没有，从 Supabase 同步
    if (!record) {
      try {
        const { getDailyTaskRecord } = await import("@/lib/data");
        record = await getDailyTaskRecord(currentChild.id, date);
      } catch (error) {
        console.error("加载任务记录失败:", error);
      }
    }
    if (record) {
      setTodayRecord(record);
    } else {
      // 创建新记录
      const newRecord: DailyTaskRecord = {
        childId: currentChild.id,
        date,
        tasks: {},
        totalStars: 0,
      };
      setTodayRecord(newRecord);
      // 立即保存初始记录（异步）
      saveDailyTaskRecord(newRecord).catch(console.error);
    }
  };

  const updateTask = (
    taskId: string,
    updates: Partial<DailyTaskItem> | ((item: DailyTaskItem | undefined) => DailyTaskItem)
  ) => {
    if (!currentChild || !todayRecord) return;

    const rule = taskRules.find((r) => r.id === taskId);
    if (!rule) return;

    const existing = todayRecord.tasks[taskId];
    
    let taskItem: DailyTaskItem;
    
    if (typeof updates === "function") {
      // 如果传入的是函数，直接使用函数的结果
      taskItem = updates(existing);
      // 确保必要字段存在
      if (!taskItem.taskId) taskItem.taskId = taskId;
      if (!taskItem.taskName) taskItem.taskName = rule.name;
    } else {
      // 如果传入的是对象，合并更新
      // 先展开已有数据与更新，再写入标准化字段，避免同名键重复警告
      taskItem = {
        ...existing,
        ...updates,
        taskId,
        taskName: rule.name,
        completed: existing?.completed || false,
        stars: existing?.stars || 0,
        count: existing?.count || 0,
        metadata: existing?.metadata,
      };
    }

    // 更新记录
    const updatedTasks = { ...todayRecord.tasks, [taskId]: taskItem };
    const totalStars = Object.values(updatedTasks).reduce(
      (sum, task) => sum + (task?.stars || 0),
      0
    );

    const updatedRecord: DailyTaskRecord = {
      ...todayRecord,
      tasks: updatedTasks,
      totalStars,
    };

    setTodayRecord(updatedRecord);
    saveDailyTaskRecord(updatedRecord).catch(console.error);
  };

  const handleToggleTask = (taskId: string) => {
    if (!currentChild || !todayRecord) {
      console.error("无法切换任务：缺少必要的数据", { currentChild, todayRecord });
      return;
    }
    
    updateTask(taskId, (item) => {
      const rule = taskRules.find((r) => r.id === taskId);
      if (!rule) {
        console.error("找不到任务规则:", taskId);
        return item || {
          taskId,
          taskName: "",
          completed: false,
          stars: 0,
        };
      }
      
      const currentCompleted = item?.completed || false;
      
      if (rule.type === "countable") {
        const currentCount = item?.count || 0;
        const maxCount = rule.maxCount || Infinity;
        const isAtMax = currentCount >= maxCount;
        
        if (isAtMax) {
          // 已达到上限，移除最后一次记录
          return removeCountableTaskCompletion(item || {
            taskId,
            taskName: rule.name,
            completed: false,
            stars: 0,
            count: 0,
          }, rule);
        } else {
          // 未达到上限，添加一次计数
          // 如果启用质量评估，应该通过质量对话框处理
          // 这里只处理没有启用质量评估的情况
          if (!rule.countableConfig?.qualityEnabled) {
            return addCountableTaskCompletion(item, rule);
          }
          // 如果启用了质量评估，返回原状态（等待质量对话框确认）
          return item || {
            taskId,
            taskName: rule.name,
            completed: false,
            stars: 0,
            count: 0,
          };
        }
      } else {
        // simple 类型的任务
        return {
          taskId,
          taskName: rule.name,
          completed: !currentCompleted,
          stars: !currentCompleted ? rule.baseStars : 0,
        };
      }
    });
  };

  const handleQualityConfirm = (taskId: string, quality: 1 | 2 | 3, reflection?: string, duration?: number) => {
    if (!currentChild || !todayRecord) return;
    
    const rule = taskRules.find((r) => r.id === taskId);
    if (!rule || rule.type !== "countable") return;
    
    updateTask(taskId, (item) => {
      return addCountableTaskCompletion(item, rule, {
        quality,
        reflection,
        duration,
      });
    });
  };

  const handleQuality = (taskId: string) => {
    setQualityTaskId(taskId);
    setQualityDialogOpen(true);
  };

  const handleDecrease = (taskId: string) => {
    if (!currentChild || !todayRecord) return;
    
    const rule = taskRules.find((r) => r.id === taskId);
    if (!rule || rule.type !== "countable") return;
    
    updateTask(taskId, (item) => {
      // 如果当前没有计数，直接返回
      if (!item || (item.count || 0) <= 0) {
        return item || {
          taskId,
          taskName: rule.name,
          completed: false,
          stars: 0,
          count: 0,
        };
      }
      
      // 移除最后一次记录
      return removeCountableTaskCompletion(item, rule);
    });
  };

  const handleInputTask = (taskId: string) => {
    setInputTaskId(taskId);
    setInputData({});
    setInputDialogOpen(true);
  };

  const handleSaveInput = () => {
    if (!inputTaskId || !currentChild || !todayRecord) return;

      const rule = taskRules.find((r) => r.id === inputTaskId);
    if (!rule || !rule.inputConfig) return;

    let stars = 0;
    if (rule.inputConfig.calculateStars) {
      stars = rule.inputConfig.calculateStars(inputData);
    } else {
      stars = rule.baseStars;
    }

    const taskItem: DailyTaskItem = {
      taskId: inputTaskId,
      taskName: rule.name,
      completed: stars > 0,
      stars,
      metadata: inputData,
    };

    const updatedTasks = { ...todayRecord.tasks, [inputTaskId]: taskItem };
    const totalStars = Object.values(updatedTasks).reduce(
      (sum, task) => sum + task.stars,
      0
    );

    const updatedRecord: DailyTaskRecord = {
      ...todayRecord,
      tasks: updatedTasks,
      totalStars,
    };

    setTodayRecord(updatedRecord);
    saveDailyTaskRecord(updatedRecord).catch(console.error);
    setInputDialogOpen(false);
    setInputTaskId(null);
    setInputData({});
  };

  if (!currentChild) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">请先选择孩子</h3>
            <Button onClick={() => router.push("/children")}>
              前往添加孩子
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 确保 todayRecord 存在
  if (!todayRecord) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">加载中...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedTasks = Object.values(todayRecord.tasks || {}).filter(
    (t) => t.completed
  ).length;
  const totalTasks = taskRules.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // 检查每日最低3星规则
  const showLowStarsWarning = todayRecord.totalStars > 0 && todayRecord.totalStars < 3;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold mb-1">每日任务</h1>
            <p className="text-muted-foreground">
              当前日期：{new Date(selectedDate + "T00:00:00").toLocaleDateString("zh-CN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Button
              variant="outline"
              onClick={() => setSelectedDate(getTodayDate())}
            >
              回到今天
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>今日进度</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">任务完成</span>
                <span className="text-sm font-medium">
                  {completedTasks} / {totalTasks}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-muted-foreground">今日星星</span>
              <StarDisplay count={todayRecord.totalStars} size="lg" />
            </div>
            {showLowStarsWarning && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  注意：每天低于3个星星将归0
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">任务列表</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {taskRules.map((rule) => (
            <TaskCard
              key={rule.id}
              rule={rule}
              taskItem={todayRecord.tasks[rule.id]}
              onToggle={handleToggleTask}
              onInput={handleInputTask}
              onQuality={handleQuality}
              onDecrease={handleDecrease}
            />
          ))}
        </div>
      </div>

      {/* 质量评估对话框 */}
      {qualityTaskId && (
        <QualityDialog
          open={qualityDialogOpen}
          onClose={() => {
            setQualityDialogOpen(false);
            setQualityTaskId(null);
          }}
          onConfirm={(quality, reflection, duration) => {
            if (qualityTaskId) {
              handleQualityConfirm(qualityTaskId, quality, reflection, duration);
              setQualityDialogOpen(false);
              setQualityTaskId(null);
            }
          }}
          taskName={taskRules.find((r) => r.id === qualityTaskId)?.name || ""}
          reflectionPrompts={
            taskRules.find((r) => r.id === qualityTaskId)?.countableConfig
              ?.reflectionPrompts
          }
          timeTrackingEnabled={
            taskRules.find((r) => r.id === qualityTaskId)?.countableConfig
              ?.timeTrackingEnabled
          }
        />
      )}

      {/* 输入对话框 */}
      <Dialog open={inputDialogOpen} onOpenChange={setInputDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {inputTaskId &&
                taskRules.find((r) => r.id === inputTaskId)?.name}
            </DialogTitle>
            <DialogDescription>
              {inputTaskId &&
                taskRules.find((r) => r.id === inputTaskId)?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {inputTaskId &&
              taskRules.find((r) => r.id === inputTaskId)?.inputConfig
                ?.fields?.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <Input
                      id={field.name}
                      type={field.type}
                      value={inputData[field.name] || ""}
                      onChange={(e) =>
                        setInputData({
                          ...inputData,
                          [field.name]:
                            field.type === "number"
                              ? parseInt(e.target.value) || 0
                              : e.target.value,
                        })
                      }
                    />
                  </div>
                ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInputDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveInput}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

