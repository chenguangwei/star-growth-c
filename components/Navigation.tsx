"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckCircle2, GraduationCap, Gift, TrendingUp, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/tasks", label: "每日任务", icon: CheckCircle2 },
  { href: "/quiz", label: "单元测验", icon: GraduationCap },
  { href: "/rewards", label: "兑换站", icon: Gift },
  { href: "/stats", label: "统计", icon: TrendingUp },
  { href: "/children", label: "孩子管理", icon: Users },
  { href: "/settings", label: "设置", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-6 h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-2xl">✨</span>
            <span>星星成长</span>
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

