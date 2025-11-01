"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCurrentChild,
} from "@/lib/children";
import {
  getAllDailyTaskRecords,
  getQuizRecords,
  getRewardExchanges,
} from "@/lib/data";
import { StarDisplay } from "@/components/StarDisplay";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Calendar, Award, Gift, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import type { DailyTaskRecord, QuizRecord, RewardExchange } from "@/types";

export default function StatsPage() {
  const router = useRouter();
  const [currentChild, setCurrentChild] = useState(getCurrentChild());
  const [dailyRecords, setDailyRecords] = useState<DailyTaskRecord[]>([]);
  const [quizRecords, setQuizRecords] = useState<QuizRecord[]>([]);
  const [exchanges, setExchanges] = useState<RewardExchange[]>([]);

  useEffect(() => {
    const child = getCurrentChild();
    if (!child) {
      router.push("/children");
    } else {
      setCurrentChild(child);
      loadData();
    }
  }, [router]);

  const loadData = () => {
    if (!currentChild) return;
    setDailyRecords(getAllDailyTaskRecords(currentChild.id));
    setQuizRecords(getQuizRecords(currentChild.id));
    setExchanges(getRewardExchanges(currentChild.id));
  };

  // 计算统计数据
  const totalStars = dailyRecords.reduce((sum, r) => sum + r.totalStars, 0) +
    quizRecords.reduce((sum, r) => sum + r.rewardStars, 0);

  const exchangedStars = exchanges.reduce((sum, e) => sum + e.starsCost, 0);
  const availableStars = totalStars - exchangedStars;

  // 本周数据
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekRecords = dailyRecords.filter(
    (r) => new Date(r.date) >= weekStart
  );
  const weeklyStars = weekRecords.reduce((sum, r) => sum + r.totalStars, 0);

  // 本月数据
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthRecords = dailyRecords.filter(
    (r) => new Date(r.date) >= monthStart
  );
  const monthlyStars = monthRecords.reduce((sum, r) => sum + r.totalStars, 0);

  // 每日星星趋势（最近30天）
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split("T")[0];
  });

  const dailyStarsData = last30Days.map((date) => {
    const record = dailyRecords.find((r) => r.date === date);
    return {
      date: new Date(date).toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
      stars: record?.totalStars || 0,
    };
  });

  // 任务完成统计
  const taskStats: Record<string, number> = {};
  dailyRecords.forEach((record) => {
    Object.values(record.tasks).forEach((task) => {
      if (task.completed) {
        taskStats[task.taskName] = (taskStats[task.taskName] || 0) + 1;
      }
    });
  });

  const topTasks = Object.entries(taskStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // 科目成绩统计
  const subjectStats = ["语文", "数学", "英语"].map((subject) => {
    const records = quizRecords.filter((r) => r.subject === subject);
    const avgGrade = records.length > 0
      ? records.reduce((sum, r) => sum + r.grade, 0) / records.length
      : 0;
    return {
      subject,
      count: records.length,
      avgGrade: avgGrade.toFixed(1),
    };
  });

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
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">数据统计</h1>
        <p className="text-muted-foreground">查看详细的学习数据和趋势</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总星星数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StarDisplay count={totalStars} size="lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              可用星星
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StarDisplay count={availableStars} size="lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              本周获得
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StarDisplay count={weeklyStars} size="lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              本月获得
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StarDisplay count={monthlyStars} size="lg" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>每日星星趋势（最近30天）</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStarsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="stars"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  dot={{ fill: "#fbbf24" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              最常完成的任务（Top 5）
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topTasks.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topTasks}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#667eea" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              科目成绩统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subjectStats.length > 0 ? (
              <div className="space-y-3">
                {subjectStats.map((stat) => (
                  <div
                    key={stat.subject}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <span className="font-medium">{stat.subject}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {stat.count} 次测验
                      </span>
                      {stat.avgGrade !== "0.0" && (
                        <span className="text-sm font-semibold">
                          平均 {stat.avgGrade} 星
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              兑换记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            {exchanges.length > 0 ? (
              <div className="space-y-2">
                {exchanges.slice(0, 5).map((exchange) => (
                  <div
                    key={exchange.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{exchange.rewardName}</p>
                      <p className="text-sm text-muted-foreground">
                        {exchange.date}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-red-500">
                      -{exchange.starsCost} ✨
                    </span>
                  </div>
                ))}
                {exchanges.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    还有 {exchanges.length - 5} 条记录...
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                暂无兑换记录
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

