import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const { userId, email, name } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 使用 service role key 创建用户资料（绕过 RLS）
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from("user_profiles")
      .upsert({
        id: userId,
        email,
        name: name || email.split("@")[0] || "",
      })
      .select()
      .single();

    if (error) {
      console.error("创建用户资料失败:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("API 错误:", error);
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

