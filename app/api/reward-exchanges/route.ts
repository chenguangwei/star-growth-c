import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/client";

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

