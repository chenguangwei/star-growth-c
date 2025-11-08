import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/client";
import type { QuizRecord } from "@/types";

// 获取单元测验记录
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
      .from("quiz_records")
      .select("*")
      .eq("child_id", childId)
      .order("date", { ascending: false });

    if (error) {
      console.error("获取单元测验记录失败:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const records: QuizRecord[] = (data || []).map((record) => ({
      id: record.id,
      childId: record.child_id,
      date: record.date,
      subject: record.subject as "语文" | "数学" | "英语",
      grade: record.grade as 3 | 4 | 5,
      rewardStars: record.reward_stars || 0,
      corrected: record.corrected || false,
      previousGrade: record.previous_grade as 3 | 4 | 5 | undefined,
      notes: record.notes || undefined,
    }));

    return NextResponse.json({ records });
  } catch (error: any) {
    console.error("API 错误:", error);
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

// 添加单元测验记录
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      );
    }

    const record: Omit<QuizRecord, "id"> = await request.json();
    
    if (!record.childId || !record.date || !record.subject || !record.grade) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from("quiz_records")
      .insert({
        child_id: record.childId,
        date: record.date,
        subject: record.subject,
        grade: record.grade,
        reward_stars: record.rewardStars,
        corrected: record.corrected || false,
        previous_grade: record.previousGrade,
        notes: record.notes,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("添加单元测验记录失败:", error);
      return NextResponse.json(
        { error: error?.message || "添加失败" },
        { status: 500 }
      );
    }

    // 更新孩子的星星总数
    const { data: child } = await supabase
      .from("children")
      .select("total_stars")
      .eq("id", record.childId)
      .single();

    if (child) {
      await supabase
        .from("children")
        .update({ total_stars: Math.max(0, (child.total_stars || 0) + record.rewardStars) })
        .eq("id", record.childId);
    }

    const quizRecord: QuizRecord = {
      id: data.id,
      childId: data.child_id,
      date: data.date,
      subject: data.subject as "语文" | "数学" | "英语",
      grade: data.grade as 3 | 4 | 5,
      rewardStars: data.reward_stars || 0,
      corrected: data.corrected || false,
      previousGrade: data.previous_grade as 3 | 4 | 5 | undefined,
      notes: data.notes || undefined,
    };

    return NextResponse.json({ record: quizRecord });
  } catch (error: any) {
    console.error("API 错误:", error);
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

