import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/client";
import type { AchievementRecord } from "@/types";

// 获取成就记录
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
      .from("achievement_records")
      .select("*")
      .eq("child_id", childId)
      .order("unlocked_at", { ascending: false });

    if (error) {
      console.error("获取成就记录失败:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const achievements: AchievementRecord[] = (data || []).map((record) => ({
      id: record.id,
      childId: record.child_id,
      achievementId: record.achievement_id,
      unlockedAt: record.unlocked_at,
      progress: record.progress || 0,
      completed: record.completed || false,
    }));

    return NextResponse.json({ achievements });
  } catch (error: any) {
    console.error("API 错误:", error);
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

// 创建或更新成就记录
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      );
    }

    const record: AchievementRecord = await request.json();
    
    if (!record.childId || !record.achievementId) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    // 检查是否已存在
    const { data: existing } = await supabase
      .from("achievement_records")
      .select("*")
      .eq("child_id", record.childId)
      .eq("achievement_id", record.achievementId)
      .single();

    if (existing) {
      // 更新现有记录
      const { error } = await supabase
        .from("achievement_records")
        .update({
          progress: record.progress || 0,
          completed: record.completed || false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        console.error("更新成就记录失败:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    } else {
      // 创建新记录
      const { error } = await supabase
        .from("achievement_records")
        .insert({
          child_id: record.childId,
          achievement_id: record.achievementId,
          unlocked_at: record.unlockedAt || new Date().toISOString(),
          progress: record.progress || 0,
          completed: record.completed || false,
        });

      if (error) {
        console.error("创建成就记录失败:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
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

