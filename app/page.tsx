"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChildSelector } from "@/components/ChildSelector";
import { StarDisplay } from "@/components/StarDisplay";
import {
  getCurrentChild,
} from "@/lib/children";
import {
  getDailyTaskRecordSync,
  getAllDailyTaskRecordsSync,
  getTodayDate,
} from "@/lib/data";
import type { DailyTaskRecord, QuizRecord } from "@/types";
import { calculateAvailableStars, calculateTotalEarnedStars } from "@/lib/calculations";
import { Calendar, CheckCircle2, GraduationCap, Gift, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();
  const [currentChild, setCurrentChild] = useState(getCurrentChild());
  const [todayStars, setTodayStars] = useState(0);
  const [weeklyStars, setWeeklyStars] = useState(0);
  const [availableStars, setAvailableStars] = useState(0);
  const [totalEarnedStars, setTotalEarnedStars] = useState(0);

  const loadDataForChild = useCallback(async (child: any) => {
    if (!child) return;

    // 今日星星（先尝试从 localStorage 读取）
    const todayRecord = getDailyTaskRecordSync(child.id);
    setTodayStars(todayRecord?.totalStars || 0);
    
    // 如果 localStorage 没有，从 Supabase 同步
    if (!todayRecord) {
      try {
        const { getDailyTaskRecord } = await import("@/lib/data");
        const record = await getDailyTaskRecord(child.id);
        setTodayStars(record?.totalStars || 0);
      } catch (error) {
        console.error("加载今日任务记录失败:", error);
      }
    }

    // 本周星星（先尝试从 localStorage 读取）
    const allRecords = getAllDailyTaskRecordsSync(child.id);
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    let weekRecords = allRecords.filter(
      (r) => new Date(r.date) >= weekStart
    );
    
    // 如果 localStorage 数据不足，从 Supabase 同步
    if (allRecords.length === 0) {
      try {
        const { getAllDailyTaskRecords } = await import("@/lib/data");
        const records = await getAllDailyTaskRecords(child.id);
        weekRecords = records.filter(
          (r) => new Date(r.date) >= weekStart
        );
      } catch (error) {
        console.error("加载任务记录失败:", error);
      }
    }
    
    const weekly = weekRecords.reduce((sum, r) => sum + r.totalStars, 0);
    setWeeklyStars(weekly);

    // 可用星星（使用统一计算函数，异步从 Supabase 同步）
    calculateAvailableStars(child.id).then((stars) => {
      setAvailableStars(stars);
    }).catch((error) => {
      console.error("计算可用星星失败:", error);
      // 如果异步计算失败，使用同步版本（仅从 localStorage）
      const { calculateAvailableStarsSync } = require("@/lib/calculations");
      setAvailableStars(calculateAvailableStarsSync(child.id));
    });

    // 总获得星星（从所有记录中计算，异步从 Supabase 同步）
    calculateTotalEarnedStars(child.id).then((stars) => {
      setTotalEarnedStars(stars);
    }).catch((error) => {
      console.error("计算总获得星星失败:", error);
      // 如果异步计算失败，使用同步版本（仅从 localStorage）
      const { getAllDailyTaskRecordsSync, getQuizRecordsSync } = require("@/lib/data");
      const dailyRecords = getAllDailyTaskRecordsSync(child.id);
      const quizRecords = getQuizRecordsSync(child.id);
      const dailyStars = dailyRecords.reduce((sum: number, r: DailyTaskRecord) => sum + r.totalStars, 0);
      const quizStars = quizRecords.reduce((sum: number, r: QuizRecord) => sum + r.rewardStars, 0);
      setTotalEarnedStars(dailyStars + quizStars);
    });
  }, []);

  useEffect(() => {
    const loadChild = async () => {
      // 先尝试从 localStorage 获取（快速）
      let child = getCurrentChild();
      
      if (!child) {
        // 如果 localStorage 没有当前孩子，尝试从 Supabase 同步
        const { getChildrenSync, getChildren } = await import("@/lib/children");
        let children = getChildrenSync();
        
        // 如果 localStorage 没有数据，从 Supabase 加载
        if (children.length === 0) {
          try {
            children = await getChildren();
            // 如果从 Supabase 加载到数据，选择第一个
            if (children.length > 0) {
              const { setCurrentChildId } = await import("@/lib/children");
              setCurrentChildId(children[0].id);
              child = children[0];
            }
          } catch (error) {
            console.error("加载孩子列表失败:", error);
          }
        } else {
          // localStorage 有数据，选择第一个
          const { setCurrentChildId } = await import("@/lib/children");
          setCurrentChildId(children[0].id);
          child = children[0];
        }
        
        // 如果还是没有孩子，跳转到孩子管理页面
        if (!child) {
          router.push("/children");
          return;
        }
      }
      
      setCurrentChild(child);
    };
    
    loadChild();
  }, [router]);

  useEffect(() => {
    if (currentChild) {
      loadDataForChild(currentChild);
    }
  }, [currentChild, loadDataForChild]);

  const handleChildChange = useCallback((child: any) => {
    setCurrentChild(child);
    // 当孩子变化时，重新加载数据
    if (child) {
      loadDataForChild(child);
    }
  }, [loadDataForChild]);

  if (!currentChild) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">加载中...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const quickActions = [
    {
      icon: CheckCircle2,
      title: "每日任务",
      description: "记录今日任务完成情况",
      href: "/tasks",
      color: "text-blue-500",
    },
    {
      icon: GraduationCap,
      title: "单元测验",
      description: "记录测验成绩",
      href: "/quiz",
      color: "text-green-500",
    },
    {
      icon: Gift,
      title: "兑换奖励",
      description: "用星星兑换心仪奖励",
      href: "/rewards",
      color: "text-yellow-500",
    },
    {
      icon: TrendingUp,
      title: "数据统计",
      description: "查看学习数据和趋势",
      href: "/stats",
      color: "text-purple-500",
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">星星成长系统</h1>
          <p className="text-muted-foreground">
            记录学习，兑换奖励，快乐成长！
          </p>
        </div>
        <ChildSelector onChildChange={handleChildChange} />
      </div>

      <div className="mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="gradient-primary text-white border-0">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 mb-2">当前可用星星</p>
                  <StarDisplay count={availableStars} size="xl" animated />
                </div>
                <div className="text-right">
                  <p className="text-white/80 mb-2">今日获得</p>
                  <StarDisplay count={todayStars} size="lg" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">本周获得</p>
                <StarDisplay count={weeklyStars} size="md" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Gift className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">可兑换星星</p>
                <StarDisplay count={availableStars} size="md" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">总获得</p>
                <StarDisplay count={totalEarnedStars} size="md" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="card-glow cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <action.icon className={`h-8 w-8 ${action.color}`} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {action.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">今日概览</h2>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">今日日期</span>
                <span className="font-medium">
                  {new Date().toLocaleDateString("zh-CN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">今日获得星星</span>
                <StarDisplay count={todayStars} size="sm" />
              </div>
              {todayStars < 3 && todayStars > 0 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ 注意：每天低于3个星星将归0，继续加油完成任务吧！
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
