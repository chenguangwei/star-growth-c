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
import { Button } from "@/components/ui/button";
import { RewardCard } from "@/components/RewardCard";
import { StarDisplay } from "@/components/StarDisplay";
import {
  getCurrentChild,
} from "@/lib/children";
import {
  addRewardExchange,
  getRewardExchanges,
} from "@/lib/data";
import {
  DEFAULT_REWARDS,
  starsToCoins,
  calculateCoinRate,
  getChildRewards,
} from "@/lib/rules";
import { calculateAvailableStars } from "@/lib/calculations";
import type { Reward, RewardExchange } from "@/types";
import { Gift, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { getTodayDate } from "@/lib/data";

export default function RewardsPage() {
  const router = useRouter();
  const [currentChild, setCurrentChild] = useState(getCurrentChild());
  const [rewards, setRewards] = useState<Reward[]>(DEFAULT_REWARDS);
  const [exchanges, setExchanges] = useState<RewardExchange[]>([]);
  const [availableStars, setAvailableStars] = useState(0);
  const [exchangeDialogOpen, setExchangeDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

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
        loadData();
      }
    };
    
    loadChild();
  }, [router]);

  const loadData = async () => {
    if (!currentChild) return;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/386a1f2e-b938-40b6-90a2-1cfb52f7051d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/rewards/page.tsx:84',message:'loadData开始',data:{childId:currentChild.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // 加载奖励列表（包含自定义奖励）
    try {
      const childRewards = await getChildRewards(currentChild.id);
      setRewards(childRewards);
    } catch (error) {
      console.error("加载奖励列表失败:", error);
      setRewards(DEFAULT_REWARDS);
    }

    const allExchanges = getRewardExchanges(currentChild.id);
    setExchanges(allExchanges);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/386a1f2e-b938-40b6-90a2-1cfb52f7051d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/rewards/page.tsx:100',message:'调用calculateAvailableStars前',data:{localExchangesCount:allExchanges.length,localExchangedStars:allExchanges.reduce((sum,e)=>sum+e.starsCost,0)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // 使用统一的计算函数（异步从 Supabase 同步）
    calculateAvailableStars(currentChild.id).then((stars) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/386a1f2e-b938-40b6-90a2-1cfb52f7051d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/rewards/page.tsx:101',message:'calculateAvailableStars完成',data:{calculatedStars:stars},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      setAvailableStars(stars);
    }).catch((error) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/386a1f2e-b938-40b6-90a2-1cfb52f7051d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/rewards/page.tsx:103',message:'calculateAvailableStars失败，使用同步版本',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error("计算可用星星失败:", error);
      // 如果异步计算失败，使用同步版本（仅从 localStorage）
      const { calculateAvailableStarsSync } = require("@/lib/calculations");
      const syncStars = calculateAvailableStarsSync(currentChild.id);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/386a1f2e-b938-40b6-90a2-1cfb52f7051d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/rewards/page.tsx:106',message:'同步版本计算结果',data:{syncStars},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      setAvailableStars(syncStars);
    });
  };

  const handleExchange = (reward: Reward) => {
    setSelectedReward(reward);
    setExchangeDialogOpen(true);
  };

  const handleConfirmExchange = async () => {
    if (!selectedReward || !currentChild) return;

    if (availableStars < selectedReward.starsCost) {
      alert("星星不足，无法兑换");
      return;
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/386a1f2e-b938-40b6-90a2-1cfb52f7051d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/rewards/page.tsx:115',message:'handleConfirmExchange开始',data:{childId:currentChild.id,rewardId:selectedReward.id,starsCost:selectedReward.starsCost,availableStarsBefore:availableStars},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/386a1f2e-b938-40b6-90a2-1cfb52f7051d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/rewards/page.tsx:124',message:'调用addRewardExchange前',data:{childId:currentChild.id,rewardId:selectedReward.id,starsCost:selectedReward.starsCost},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      await addRewardExchange({
        childId: currentChild.id,
        rewardId: selectedReward.id,
        rewardName: selectedReward.name,
        starsCost: selectedReward.starsCost,
        status: "used",
      });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/386a1f2e-b938-40b6-90a2-1cfb52f7051d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/rewards/page.tsx:133',message:'addRewardExchange完成，准备更新状态',data:{availableStarsBefore:availableStars,starsCost:selectedReward.starsCost,newAvailableStars:availableStars - selectedReward.starsCost},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      // 立即更新可用星星（从当前值减去兑换的星星）
      setAvailableStars(availableStars - selectedReward.starsCost);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/386a1f2e-b938-40b6-90a2-1cfb52f7051d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/rewards/page.tsx:136',message:'调用loadData前',data:{availableStarsState:availableStars},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      // 重新加载数据（包括兑换历史）
      loadData();
      
      setExchangeDialogOpen(false);
      setSelectedReward(null);
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/386a1f2e-b938-40b6-90a2-1cfb52f7051d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/rewards/page.tsx:142',message:'兑换失败',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error("兑换奖励失败:", error);
      alert("兑换失败，请重试");
    }
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

  const coinRate = calculateCoinRate(currentChild.totalStars);
  const canGetCoins = availableStars >= 40;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="h-6 w-6" />
          <h1 className="text-3xl font-bold">梦想兑换站</h1>
        </div>
        <p className="text-muted-foreground">
          用获得的星星兑换心仪的奖励吧！
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">可用星星</CardTitle>
          </CardHeader>
          <CardContent>
            <StarDisplay count={availableStars} size="lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">兑换比例</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-sm">
                {canGetCoins ? (
                  <>
                    <span className="font-semibold">2 星星 = 1 元</span>
                    <span className="text-muted-foreground ml-2">
                      (超过40星)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold">3 星星 = 1 元</span>
                    <span className="text-muted-foreground ml-2">
                      (低于40星)
                    </span>
                  </>
                )}
              </p>
              {currentChild.totalStars >= 200 && (
                <p className="text-xs text-muted-foreground">
                  超过200星特殊规则：星星数 × 0.5
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">可兑换金额</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ¥{starsToCoins(availableStars, currentChild.totalStars).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">奖励列表</h2>
          <Button
            variant="outline"
            onClick={() => router.push("/rewards/manage")}
          >
            管理奖励
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              availableStars={availableStars}
              onExchange={handleExchange}
            />
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5" />
          <h2 className="text-xl font-semibold">兑换历史</h2>
        </div>
        {exchanges.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Gift className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">还没有兑换记录</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {exchanges.map((exchange) => (
              <Card key={exchange.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{exchange.rewardName}</p>
                      <p className="text-sm text-muted-foreground">
                        {exchange.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        -{exchange.starsCost}
                      </span>
                      <span className="text-yellow-500">✨</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={exchangeDialogOpen} onOpenChange={setExchangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认兑换</DialogTitle>
            <DialogDescription>
              确定要用 {selectedReward?.starsCost} 个星星兑换{" "}
              {selectedReward?.name} 吗？
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">当前星星：</span>
                <span className="font-semibold">{availableStars} ✨</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">兑换消耗：</span>
                <span className="font-semibold text-red-500">
                  -{selectedReward?.starsCost} ✨
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">剩余星星：</span>
                <span className="font-semibold">
                  {availableStars - (selectedReward?.starsCost || 0)} ✨
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExchangeDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleConfirmExchange}>确认兑换</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

