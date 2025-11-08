"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AchievementBadge } from "@/components/AchievementBadge";
import type { Achievement, AchievementRecord } from "@/types";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { Trophy, Sparkles } from "lucide-react";

interface AchievementGridProps {
  childId: string;
  records: AchievementRecord[];
  showProgress?: boolean;
}

export function AchievementGrid({
  childId,
  records,
  showProgress = true,
}: AchievementGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // 获取所有分类
  const categories = Array.from(
    new Set(ACHIEVEMENTS.map((a) => a.category || "其他"))
  );
  
  // 过滤成就
  const filteredAchievements = ACHIEVEMENTS.filter((achievement) => {
    if (selectedCategory === "all") return true;
    return achievement.category === selectedCategory;
  });
  
  // 统计信息
  const unlockedCount = records.filter((r) => r.completed).length;
  const totalCount = ACHIEVEMENTS.length;
  const unlockedPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
  
  // 按稀有度排序
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    const aRarity = rarityOrder[a.rarity];
    const bRarity = rarityOrder[b.rarity];
    if (aRarity !== bRarity) return aRarity - bRarity;
    
    // 相同稀有度，已解锁的排在前面
    const aUnlocked = records.find((r) => r.achievementId === a.id)?.completed || false;
    const bUnlocked = records.find((r) => r.achievementId === b.id)?.completed || false;
    if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1;
    
    return 0;
  });
  
  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            成就统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{unlockedCount} / {totalCount}</p>
              <p className="text-sm text-muted-foreground">已解锁成就</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{unlockedPercent}%</p>
              <p className="text-sm text-muted-foreground">完成度</p>
            </div>
          </div>
          {/* 进度条 */}
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${unlockedPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* 分类标签 */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="all">全部</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={selectedCategory} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedAchievements.map((achievement) => {
              const record = records.find((r) => r.achievementId === achievement.id);
              return (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  record={record}
                  showProgress={showProgress}
                />
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

