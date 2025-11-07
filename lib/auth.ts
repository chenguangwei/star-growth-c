import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { createServerClient, createServiceClient } from "@/lib/supabase/client";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const supabase = createServerClient();
        
        // 使用 Supabase Auth 登录
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error) {
          console.error("登录错误:", error);
          
          // 如果是邮箱未确认错误，尝试自动确认（开发环境）
          if (error.message?.includes("Email not confirmed") || error.code === "email_not_confirmed") {
            // 尝试使用 service role key 确认邮箱
            try {
              const serviceClient = createServiceClient();
              
              // 通过邮箱查找用户
              const { data: usersList } = await serviceClient.auth.admin.listUsers();
              const user = usersList?.users.find(u => u.email === credentials.email);
              
              if (user) {
                // 更新用户为已确认
                await serviceClient.auth.admin.updateUserById(user.id, {
                  email_confirm: true,
                });
                
                // 重新尝试登录
                const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                  email: credentials.email,
                  password: credentials.password,
                });
                
                if (retryError || !retryData.user) {
                  return null;
                }
                
                // 继续处理登录成功的情况
                const finalData = retryData;
                const serviceSupabase = createServiceClient();
                
                // 确保用户资料存在（使用 service client 绕过 RLS）
                const { data: profile } = await serviceSupabase
                  .from("user_profiles")
                  .select("*")
                  .eq("id", finalData.user.id)
                  .single();

                if (!profile) {
                  await serviceSupabase.from("user_profiles").insert({
                    id: finalData.user.id,
                    email: finalData.user.email,
                    name: finalData.user.user_metadata?.name || finalData.user.email?.split("@")[0] || "",
                  });
                }

                return {
                  id: finalData.user.id,
                  email: finalData.user.email || "",
                  name: finalData.user.user_metadata?.name || finalData.user.email?.split("@")[0],
                };
              }
            } catch (adminError) {
              console.error("自动确认邮箱失败:", adminError);
              // 即使自动确认失败，也返回 null，让用户知道需要验证邮箱
            }
          }
          
          return null;
        }

        if (!data.user) {
          return null;
        }

        // 使用 service client 确保用户资料存在（绕过 RLS）
        const serviceSupabase = createServiceClient();
        const { data: profile } = await serviceSupabase
          .from("user_profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (!profile) {
          // 如果用户资料不存在，创建它
          await serviceSupabase.from("user_profiles").insert({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "",
          });
        }

        return {
          id: data.user.id,
          email: data.user.email || "",
          name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      // OAuth 登录时，在 Supabase 中创建或更新用户资料
      if (account && (account.provider === "google" || account.provider === "github")) {
        const supabase = createServerClient();
        
        if (user.email) {
          // 确保用户资料存在（使用 NextAuth 的 user.id）
          // 注意：OAuth 用户的 id 来自 NextAuth，不是 Supabase Auth
          // 我们需要在 user_profiles 表中存储，但 children 表需要关联到实际的 Supabase user_id
          // 为了简化，我们使用 NextAuth user.id 作为 user_profiles.id
          const { data: existingProfile } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (!existingProfile) {
            await supabase.from("user_profiles").upsert({
              id: user.id,
              email: user.email || "",
              name: user.name || user.email?.split("@")[0] || "",
              avatar: user.image || "",
            });
          } else {
            // 更新现有资料
            await supabase
              .from("user_profiles")
              .update({
                email: user.email || "",
                name: user.name || existingProfile.name,
                avatar: user.image || existingProfile.avatar,
              })
              .eq("id", user.id);
          }
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

