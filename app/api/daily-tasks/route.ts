import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/client";
import type { DailyTaskRecord } from "@/types";

// 获取每日任务记录
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
    const date = searchParams.get("date");
    
    if (!childId) {
      return NextResponse.json(
        { error: "缺少孩子ID" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    if (date) {
      // 获取指定日期的记录
      const { data, error } = await supabase
        .from("daily_task_records")
        .select("*")
        .eq("child_id", childId)
        .eq("date", date)
        .single();

      if (error || !data) {
        return NextResponse.json({ record: null });
      }

      const record: DailyTaskRecord = {
        childId: data.child_id,
        date: data.date,
        tasks: data.tasks || {},
        totalStars: data.total_stars || 0,
        notes: data.notes || undefined,
      };

      return NextResponse.json({ record });
    } else {
      // 获取所有记录
      const { data, error } = await supabase
        .from("daily_task_records")
        .select("*")
        .eq("child_id", childId)
        .order("date", { ascending: false });

      if (error) {
        console.error("获取每日任务记录失败:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      const records: DailyTaskRecord[] = (data || []).map((record) => ({
        childId: record.child_id,
        date: record.date,
        tasks: record.tasks || {},
        totalStars: record.total_stars || 0,
        notes: record.notes || undefined,
      }));

      return NextResponse.json({ records });
    }
  } catch (error: any) {
    console.error("API 错误:", error);
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

// 保存每日任务记录
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      );
    }

    const record: DailyTaskRecord = await request.json();
    
    if (!record.childId || !record.date) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    // 检查是否存在旧记录（同时获取 ID 和 total_stars）
    const { data: existingRecord, error: selectError } = await supabase
      .from("daily_task_records")
      .select("id, total_stars")
      .eq("child_id", record.childId)
      .eq("date", record.date)
      .maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 是 "not found" 错误，可以忽略
      console.error("查询每日任务记录失败:", selectError);
      return NextResponse.json(
        { error: selectError.message },
        { status: 500 }
      );
    }

    // 计算星星增量
    let delta = record.totalStars;
    if (existingRecord) {
      delta = record.totalStars - (existingRecord.total_stars || 0);
    }

    let error;
    if (existingRecord) {
      // 记录已存在，执行更新
      const { error: updateError } = await supabase
        .from("daily_task_records")
        .update({
          tasks: record.tasks,
          total_stars: record.totalStars,
          notes: record.notes,
        })
        .eq("id", existingRecord.id);
      error = updateError;
    } else {
      // 记录不存在，执行插入
      const { error: insertError } = await supabase
        .from("daily_task_records")
        .insert({
          child_id: record.childId,
          date: record.date,
          tasks: record.tasks,
          total_stars: record.totalStars,
          notes: record.notes,
        });
      error = insertError;
    }

    if (error) {
      console.error("保存每日任务记录失败:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 更新孩子的星星总数
    if (delta !== 0) {
      const { data: child } = await supabase
        .from("children")
        .select("total_stars")
        .eq("id", record.childId)
        .single();

      if (child) {
        await supabase
          .from("children")
          .update({ total_stars: Math.max(0, (child.total_stars || 0) + delta) })
          .eq("id", record.childId);
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

