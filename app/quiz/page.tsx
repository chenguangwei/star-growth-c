"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StarDisplay } from "@/components/StarDisplay";
import { Badge } from "@/components/ui/badge";
import {
  getCurrentChild,
} from "@/lib/children";
import {
  addQuizRecord,
  getQuizRecordsSync,
  updateQuizRecord,
} from "@/lib/data";
import { QUIZ_RULES } from "@/lib/rules";
import type { QuizRecord } from "@/types";
import { GraduationCap, Trophy, TrendingUp, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { getTodayDate } from "@/lib/data";
import { motion } from "framer-motion";

const SUBJECTS = ["语文", "数学", "英语"] as const;
const GRADES = [3, 4, 5] as const;

export default function QuizPage() {
  const router = useRouter();
  const [currentChild, setCurrentChild] = useState(getCurrentChild());
  const [records, setRecords] = useState<QuizRecord[]>([]);
  const [formData, setFormData] = useState({
    subject: "" as "语文" | "数学" | "英语" | "",
    grade: "" as "3" | "4" | "5" | "",
    date: getTodayDate(),
  });

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
      if (child) {
        loadRecords();
      }
    };
    
    loadChild();
  }, [router]);

  const loadRecords = async () => {
    if (!currentChild) return;
    
    // 先尝试从 localStorage 读取（快速）
    let quizRecords = getQuizRecordsSync(currentChild.id);
    
    // 如果 localStorage 没有数据，从 Supabase 同步
    if (quizRecords.length === 0) {
      try {
        const { getQuizRecords } = await import("@/lib/data");
        quizRecords = await getQuizRecords(currentChild.id);
      } catch (error) {
        console.error("加载测验记录失败:", error);
      }
    }
    
    setRecords(quizRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const calculateRewardStars = (
    grade: 3 | 4 | 5,
    previousGrade?: 3 | 4 | 5
  ): number => {
    const rule = QUIZ_RULES.find((r) => r.grade === grade);
    if (!rule) return 0;

    let stars = rule.rewardStars;

    // 检查进步奖励
    if (
      previousGrade &&
      rule.progressBonus &&
      previousGrade === rule.progressBonus.from &&
      grade === rule.progressBonus.to
    ) {
      stars += rule.progressBonus.bonusStars;
    }

    return stars;
  };

  const handleSubmit = () => {
    if (!currentChild || !formData.subject || !formData.grade) {
      alert("请填写完整信息");
      return;
    }

    // 类型断言：经过上面的检查，subject 和 grade 肯定不为空
    const subject = formData.subject as "语文" | "数学" | "英语";

    // 检查是否已有该科目最近一次记录（用于计算进步）
    const recentRecord = records
      .filter((r) => r.subject === subject)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    const previousGrade = recentRecord?.grade;

    const grade = parseInt(formData.grade) as 3 | 4 | 5;
    const rewardStars = calculateRewardStars(grade, previousGrade);

    (async () => {
      try {
        await addQuizRecord({
          childId: currentChild.id,
          date: formData.date,
          subject,
          grade,
          rewardStars,
          corrected: false,
          previousGrade,
        });

        setFormData({
          subject: "" as "语文" | "数学" | "英语" | "",
          grade: "" as "3" | "4" | "5" | "",
          date: getTodayDate(),
        });

        loadRecords();
      } catch (error) {
        console.error("添加测验记录失败:", error);
        alert("保存失败，请重试");
      }
    })();
  };

  const handleMarkCorrected = (recordId: string) => {
    updateQuizRecord(recordId, { corrected: true });
    loadRecords();
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm("确定要删除这条测验记录吗？删除后对应的星星奖励也会被扣除。")) {
      return;
    }

    try {
      const response = await fetch(`/api/quiz-records/${recordId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "删除失败");
      }

      // 从 localStorage 删除并更新孩子星星总数
      const { STORAGE_KEYS } = await import("@/types");
      const data = localStorage.getItem(STORAGE_KEYS.QUIZ_RECORDS);
      if (data) {
        try {
          const records: QuizRecord[] = JSON.parse(data);
          const recordToDelete = records.find((r) => r.id === recordId);
          const filtered = records.filter((r) => r.id !== recordId);
          localStorage.setItem(STORAGE_KEYS.QUIZ_RECORDS, JSON.stringify(filtered));
          
          // 更新孩子的星星总数（扣除奖励的星星）
          if (recordToDelete && currentChild) {
            const { updateChildStarsSync } = await import("@/lib/children");
            updateChildStarsSync(currentChild.id, -recordToDelete.rewardStars);
          }
        } catch (error) {
          console.error("更新 localStorage 失败:", error);
        }
      }

      loadRecords();
    } catch (error: any) {
      console.error("删除测验记录失败:", error);
      alert(error.message || "删除失败，请重试");
    }
  };

  const getGradeColor = (grade: 3 | 4 | 5) => {
    switch (grade) {
      case 5:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case 4:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case 3:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    }
  };

  const getGradeLabel = (grade: 3 | 4 | 5) => {
    return `${grade}星`;
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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <GraduationCap className="h-6 w-6" />
          <h1 className="text-3xl font-bold">单元测验记录</h1>
        </div>
        <p className="text-muted-foreground">
          记录单元测验成绩，自动计算奖励星星
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>新增测验记录</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>科目</Label>
              <Select
                value={formData.subject}
                onValueChange={(value) =>
                  setFormData({ ...formData, subject: value as typeof formData.subject })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择科目" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>成绩</Label>
              <Select
                value={formData.grade}
                onValueChange={(value) =>
                  setFormData({ ...formData, grade: value as typeof formData.grade })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择成绩" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>
                      {getGradeLabel(grade)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>日期</Label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full">
            记录成绩
          </Button>
        </CardContent>
      </Card>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">历史记录</h2>
        {records.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">还没有测验记录</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge
                            className={getGradeColor(record.grade)}
                          >
                            {getGradeLabel(record.grade)}
                          </Badge>
                          <span className="font-semibold">{record.subject}</span>
                          {record.previousGrade && record.grade > record.previousGrade && (
                            <Badge variant="outline" className="gap-1">
                              <TrendingUp className="h-3 w-3" />
                              进步
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {record.date}
                        </p>
                        {record.grade === 3 && !record.corrected && (
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="secondary">智慧星任务</Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkCorrected(record.id)}
                            >
                              标记已完成订正
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <StarDisplay count={record.rewardStars} size="sm" />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(record.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

