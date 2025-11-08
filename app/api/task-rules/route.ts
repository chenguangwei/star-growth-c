import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/client";
import type { DailyTaskRule } from "@/types";

// 获取任务规则
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
      .from("task_rules")
      .select("*")
      .eq("child_id", childId)
      .eq("enabled", true)  // 只获取启用的规则
      .order("created_at", { ascending: false });

    if (error) {
      console.error("获取任务规则失败:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const rules: DailyTaskRule[] = (data || []).map((rule) => ({
      id: rule.rule_id,
      name: rule.name,
      description: rule.description,
      baseStars: rule.base_stars || 1,
      maxCount: rule.max_count || undefined,
      type: rule.type as "simple" | "countable" | "input",
      inputConfig: rule.input_config
        ? {
            fields: rule.input_config.fields || [],
          }
        : undefined,
    }));

    return NextResponse.json({ rules });
  } catch (error: any) {
    console.error("API 错误:", error);
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

// 保存任务规则
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      );
    }

    const { childId, rule } = await request.json();
    
    if (!childId || !rule) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    const inputConfig = rule.inputConfig
      ? {
          fields: rule.inputConfig.fields || [],
        }
      : null;

    const { error } = await supabase.from("task_rules").upsert({
      child_id: childId,
      rule_id: rule.id,
      name: rule.name,
      description: rule.description,
      base_stars: rule.baseStars,
      max_count: rule.maxCount || null,
      type: rule.type,
      input_config: inputConfig,
      enabled: true,
    });

    if (error) {
      console.error("保存任务规则失败:", error);
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

// 删除任务规则
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
    const ruleId = searchParams.get("ruleId");
    
    if (!childId || !ruleId) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from("task_rules")
      .delete()
      .eq("child_id", childId)
      .eq("rule_id", ruleId);

    if (error) {
      console.error("删除任务规则失败:", error);
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

// 更新任务规则状态（启用/禁用）
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      );
    }

    const { childId, ruleId, enabled } = await request.json();
    
    if (!childId || !ruleId || enabled === undefined) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from("task_rules")
      .update({ enabled })
      .eq("child_id", childId)
      .eq("rule_id", ruleId);

    if (error) {
      console.error("更新任务规则状态失败:", error);
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

