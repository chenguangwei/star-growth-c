"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  getCurrentChild,
} from "@/lib/children";
import { DAILY_TASK_RULES, QUIZ_RULES, DEFAULT_REWARDS, REWARD_RULE } from "@/lib/rules";
import { Settings, Lock, FileText, Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [currentChild, setCurrentChild] = useState(getCurrentChild());

  useEffect(() => {
    const child = getCurrentChild();
    if (!child) {
      router.push("/children");
    } else {
      setCurrentChild(child);
    }
  }, [router]);

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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">设置与规则</h1>
        </div>
        <p className="text-muted-foreground">查看规则说明和管理系统设置</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            当前孩子信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl">{currentChild.avatar}</div>
            <div>
              <p className="font-semibold text-lg">{currentChild.name}</p>
              <p className="text-sm text-muted-foreground">
                创建于 {new Date(currentChild.createdAt).toLocaleDateString("zh-CN")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            父母管理后台
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            进入父母管理后台可以修改数据、管理孩子档案、调整规则等高级功能。
          </p>
          <Button onClick={() => router.push("/admin")} className="gap-2">
            <Lock className="h-4 w-4" />
            进入管理后台
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>每日任务规则说明</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {DAILY_TASK_RULES.map((rule) => (
              <AccordionItem key={rule.id} value={rule.id}>
                <AccordionTrigger>
                  <div className="flex items-center gap-2 text-left">
                    <span>{rule.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({rule.baseStars} ✨)
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{rule.description}</p>
                  {rule.maxCount && (
                    <p className="text-xs text-muted-foreground mt-2">
                      每天最多完成 {rule.maxCount} 次
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>单元测验规则说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {QUIZ_RULES.map((rule) => (
              <div key={rule.grade} className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold mb-1">{rule.grade}星成绩</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  基础奖励：{rule.rewardStars} ✨
                </p>
                {rule.specialTasks?.map((task, idx) => (
                  <div key={idx} className="text-sm text-muted-foreground mb-1">
                    • {task.taskName}：{task.rewardStars} ✨
                  </div>
                ))}
                {rule.progressBonus && (
                  <div className="text-sm text-green-600 dark:text-green-400 mt-2">
                    进步奖励：{rule.progressBonus.from}星 → {rule.progressBonus.to}星
                    ，额外奖励 {rule.progressBonus.bonusStars} ✨
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            奖励兑换规则
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">钱币兑换比例</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• 低于40星星：3个星星 = 1元</li>
                <li>• 超过40星星：2个星星 = 1元</li>
                <li>• 超过200星星：星星数 × 0.8 = 兑换钱币数</li>
              </ul>
            </div>
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">可用奖励</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {DEFAULT_REWARDS.map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span className="text-sm">{reward.name}</span>
                    <span className="text-sm font-semibold">
                      {reward.starsCost} ✨
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>特殊规则</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="font-semibold mb-1">每日最低星星要求</p>
            <p className="text-muted-foreground">
              每天低于3个星星将归0
            </p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <p className="font-semibold mb-1">欺骗行为</p>
            <p className="text-muted-foreground">
              如果发现有欺骗行为或虚假完成任务的情况，将扣除 10 ✨
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="font-semibold mb-1">影响他人学习</p>
            <p className="text-muted-foreground">
              影响别人学习者每次扣 1 ✨
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

