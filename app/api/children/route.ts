import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      );
    }

    // 使用 service role key 绕过 RLS
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from("children")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("获取孩子列表失败:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const children = data?.map((child) => ({
      id: child.id,
      name: child.name,
      avatar: child.avatar,
      createdAt: child.created_at,
      totalStars: child.total_stars || 0,
    })) || [];

    return NextResponse.json({ children });
  } catch (error: any) {
    console.error("API 错误:", error);
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      );
    }

    const { name, avatar } = await request.json();
    
    if (!name || !avatar) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from("children")
      .insert({
        user_id: session.user.id,
        name: name.trim(),
        avatar,
        total_stars: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("添加孩子失败:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const child = {
      id: data.id,
      name: data.name,
      avatar: data.avatar,
      createdAt: data.created_at,
      totalStars: data.total_stars || 0,
    };

    return NextResponse.json({ child });
  } catch (error: any) {
    console.error("API 错误:", error);
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      );
    }

    const { id, name, avatar } = await request.json();
    
    if (!id || !name || !avatar) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from("children")
      .update({ name: name.trim(), avatar })
      .eq("id", id)
      .eq("user_id", session.user.id) // 确保只能更新自己的数据
      .select()
      .single();

    if (error) {
      console.error("更新孩子失败:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "未找到要更新的孩子" },
        { status: 404 }
      );
    }

    const child = {
      id: data.id,
      name: data.name,
      avatar: data.avatar,
      createdAt: data.created_at,
      totalStars: data.total_stars || 0,
    };

    return NextResponse.json({ child });
  } catch (error: any) {
    console.error("API 错误:", error);
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

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
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "缺少孩子ID" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from("children")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id); // 确保只能删除自己的数据

    if (error) {
      console.error("删除孩子失败:", error);
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

