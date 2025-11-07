"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    signOut({ redirect: false }).then(() => {
      router.push("/auth/signin");
    });
  }, [router]);

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-6">
      <Card>
        <CardContent className="p-6">
          <p className="text-center">正在退出登录...</p>
        </CardContent>
      </Card>
    </div>
  );
}

