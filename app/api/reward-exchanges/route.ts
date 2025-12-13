import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/client";

// 创建兑换记录
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { childId, rewardId, rewardName, starsCost, status, notes } = body;
    
    if (!childId || !rewardId || !rewardName || starsCost === undefined) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    // 插入兑换记录
    const { data, error } = await supabase
      .from("reward_exchanges")
      .insert({
        child_id: childId,
        date: new Date().toISOString().split("T")[0],
        reward_id: rewardId,
        reward_name: rewardName,
        stars_cost: starsCost,
        status: status || "used",
        notes: notes || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("插入兑换记录失败:", error);
      return NextResponse.json(
        { error: error?.message || "插入兑换记录失败" },
        { status: 500 }
      );
    }

    // 扣除孩子的星星
    const { data: child } = await supabase
      .from("children")
      .select("total_stars")
      .eq("id", childId)
      .single();

    if (child) {
      await supabase
        .from("children")
        .update({ total_stars: Math.max(0, (child.total_stars || 0) - starsCost) })
        .eq("id", childId);
    }

    const exchange = {
      id: data.id,
      childId: data.child_id,
      date: data.date,
      rewardId: data.reward_id,
      rewardName: data.reward_name,
      starsCost: data.stars_cost,
      status: data.status as "used" | "pending",
      notes: data.notes || undefined,
    };

    return NextResponse.json({ exchange });
  } catch (error: any) {
    console.error("API 错误:", error);
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

// 获取兑换记录
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");
    
    if (!childId) {
      return NextResponse.json(
        { error: "缺少孩子ID" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from("reward_exchanges")
      .select("*")
      .eq("child_id", childId)
      .order("date", { ascending: false });

    if (error) {
      console.error("获取兑换记录失败:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const exchanges = (data || []).map((exchange) => ({
      id: exchange.id,
      childId: exchange.child_id,
      date: exchange.date,
      rewardId: exchange.reward_id,
      rewardName: exchange.reward_name,
      starsCost: exchange.stars_cost,
      status: exchange.status as "used" | "pending",
      notes: exchange.notes || undefined,
    }));

    return NextResponse.json({ exchanges });
  } catch (error: any) {
    console.error("API 错误:", error);
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

