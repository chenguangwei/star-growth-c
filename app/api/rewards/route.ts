import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/client";
import type { Reward } from "@/types";

// 获取奖励列表
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
      .from("rewards")
      .select("*")
      .eq("child_id", childId)
      .eq("enabled", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("获取奖励列表失败:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const rewards: Reward[] = (data || []).map((reward) => ({
      id: reward.reward_id,
      name: reward.name,
      description: reward.description || undefined,
      starsCost: reward.stars_cost,
      category: reward.category || undefined,
    }));

    return NextResponse.json({ rewards });
  } catch (error: any) {
    console.error("API 错误:", error);
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

// 保存奖励（创建或更新）
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      );
    }

    const { childId, reward } = await request.json();
    
    if (!childId || !reward) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    // 先检查记录是否存在
    const { data: existing } = await supabase
      .from("rewards")
      .select("id")
      .eq("child_id", childId)
      .eq("reward_id", reward.id)
      .maybeSingle();

    let error;
    if (existing) {
      // 如果记录存在，执行更新
      ({ error } = await supabase
        .from("rewards")
        .update({
          name: reward.name,
          description: reward.description || null,
          stars_cost: reward.starsCost,
          category: reward.category || null,
          enabled: true,
        })
        .eq("child_id", childId)
        .eq("reward_id", reward.id));
    } else {
      // 如果记录不存在，执行插入
      ({ error } = await supabase.from("rewards").insert({
        child_id: childId,
        reward_id: reward.id,
        name: reward.name,
        description: reward.description || null,
        stars_cost: reward.starsCost,
        category: reward.category || null,
        enabled: true,
      }));
    }

    if (error) {
      console.error("保存奖励失败:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API 错误:", error);
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

// 删除奖励
export async function DELETE(request: NextRequest) {
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
    const rewardId = searchParams.get("rewardId");
    
    if (!childId || !rewardId) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from("rewards")
      .delete()
      .eq("child_id", childId)
      .eq("reward_id", rewardId);

    if (error) {
      console.error("删除奖励失败:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API 错误:", error);
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

// 更新奖励状态（启用/禁用）
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      );
    }

    const { childId, rewardId, enabled } = await request.json();
    
    if (!childId || !rewardId || enabled === undefined) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from("rewards")
      .update({ enabled })
      .eq("child_id", childId)
      .eq("reward_id", rewardId);

    if (error) {
      console.error("更新奖励状态失败:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API 错误:", error);
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

