import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/client";

// 更新单元测验记录
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      );
    }

    // 处理 params 可能是 Promise 的情况（Next.js 15+）
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;
    
    if (!id) {
      return NextResponse.json(
        { error: "缺少记录ID" },
        { status: 400 }
      );
    }

    const { corrected, rewardStars } = await request.json();
    
    if (corrected === undefined && rewardStars === undefined) {
      return NextResponse.json(
        { error: "缺少更新字段" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    // 先获取旧记录信息，用于计算星星增量
    const { data: oldRecord, error: selectError } = await supabase
      .from("quiz_records")
      .select("child_id, reward_stars")
      .eq("id", id)
      .single();

    if (selectError || !oldRecord) {
      return NextResponse.json(
        { error: "未找到要更新的记录" },
        { status: 404 }
      );
    }

    // 构建更新数据
    const updateData: any = {};
    if (corrected !== undefined) updateData.corrected = corrected;
    if (rewardStars !== undefined) updateData.reward_stars = rewardStars;

    // 更新记录
    const { error } = await supabase
      .from("quiz_records")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("更新单元测验记录失败:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 如果修改了rewardStars，更新孩子的星星总数
    if (rewardStars !== undefined) {
      const delta = rewardStars - oldRecord.reward_stars;
      const { data: child } = await supabase
        .from("children")
        .select("total_stars")
        .eq("id", oldRecord.child_id)
        .single();

      if (child) {
        await supabase
          .from("children")
          .update({ total_stars: Math.max(0, (child.total_stars || 0) + delta) })
          .eq("id", oldRecord.child_id);
      }
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

// 删除单元测验记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      );
    }

    // 处理 params 可能是 Promise 的情况（Next.js 15+）
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;
    
    if (!id) {
      return NextResponse.json(
        { error: "缺少记录ID" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    // 先获取记录信息，用于计算星星增量
    const { data: record, error: selectError } = await supabase
      .from("quiz_records")
      .select("child_id, reward_stars")
      .eq("id", id)
      .single();

    if (selectError || !record) {
      return NextResponse.json(
        { error: "未找到要删除的记录" },
        { status: 404 }
      );
    }

    // 删除记录
    const { error } = await supabase
      .from("quiz_records")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("删除单元测验记录失败:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 更新孩子的星星总数（扣除奖励的星星）
    const { data: child } = await supabase
      .from("children")
      .select("total_stars")
      .eq("id", record.child_id)
      .single();

    if (child) {
      await supabase
        .from("children")
        .update({ total_stars: Math.max(0, (child.total_stars || 0) - record.reward_stars) })
        .eq("id", record.child_id);
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

