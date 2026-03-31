import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/lib/prisma";
import { WorkspaceRole } from "@prisma/client";

// Auth options configuration for NextAuth.js v5
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/signin",
    signOut: "/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/dashboard",
  },
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: [
            "openid",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
          ].join(" "),
        },
      },
    }),
    
    // GitHub OAuth Provider
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
    }),
    
    // Email Magic Link Provider
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || "noreply@realbuzzer.com",
      maxAge: 24 * 60 * 60, // Magic link valid for 24 hours
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        // Custom email sending logic can be implemented here
        // For now, using default or you can integrate with Resend/SendGrid
        const { sendVerificationRequest: defaultSend } = await import(
          "next-auth/providers/email"
        );
        // In production, implement custom email template
        console.log(`Magic link for ${identifier}: ${url}`);
      },
    }),
  ],
  
  callbacks: {
    // JWT callback - called when JWT is created or updated
    async jwt({ token, user, account, profile, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        
        // Fetch user's workspaces and set default
        const userWorkspaces = await prisma.workspaceMember.findMany({
          where: { userId: user.id },
          include: { workspace: true },
          orderBy: { joinedAt: "asc" },
        });
        
        if (userWorkspaces.length > 0) {
          const primaryWorkspace = userWorkspaces[0];
          token.currentWorkspaceId = primaryWorkspace.workspaceId;
          token.workspaceRole = primaryWorkspace.role;
          token.workspaces = userWorkspaces.map((m) => ({
            id: m.workspaceId,
            name: m.workspace.name,
            slug: m.workspace.slug,
            role: m.role,
          }));
        } else {
          // Create personal workspace for new users
          const newWorkspace = await prisma.workspace.create({
            data: {
              name: `${user.name || user.email?.split("@")[0]}'s Workspace`,
              slug: `personal-${user.id.slice(-8)}`,
              ownerId: user.id,
              members: {
                create: {
                  userId: user.id,
                  role: "OWNER",
                },
              },
            },
          });
          
          token.currentWorkspaceId = newWorkspace.id;
          token.workspaceRole = "OWNER";
          token.workspaces = [{
            id: newWorkspace.id,
            name: newWorkspace.name,
            slug: newWorkspace.slug,
            role: "OWNER",
          }];
        }
      }
      
      // Handle session update (e.g., switching workspaces)
      if (trigger === "update" && session?.currentWorkspaceId) {
        const membership = await prisma.workspaceMember.findFirst({
          where: {
            userId: token.id as string,
            workspaceId: session.currentWorkspaceId,
          },
        });
        
        if (membership) {
          token.currentWorkspaceId = session.currentWorkspaceId;
          token.workspaceRole = membership.role;
        }
      }
      
      return token;
    },
    
    // Session callback - called whenever session is accessed
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string | null;
        session.user.currentWorkspaceId = token.currentWorkspaceId as string | undefined;
        session.user.workspaceRole = token.workspaceRole as WorkspaceRole | undefined;
        session.user.workspaces = token.workspaces as Array<{
          id: string;
          name: string;
          slug: string;
          role: WorkspaceRole;
        }> | undefined;
      }
      
      return session;
    },
    
    // Sign in callback - control who can sign in
    async signIn({ user, account, profile, email, credentials }) {
      // Allow OAuth sign ins
      if (account?.provider === "google" || account?.provider === "github") {
        return true;
      }
      
      // Allow email magic link
      if (account?.provider === "email") {
        return true;
      }
      
      return true;
    },
    
    // Redirect callback - control where users are redirected after sign in
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      
      return baseUrl;
    },
  },
  
  events: {
    // Event triggered when user creates account
    async createUser({ user }) {
      console.log(`New user created: ${user.email}`);
      // Additional onboarding logic can be added here
    },
    
    // Event triggered on successful sign in
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User signed in: ${user.email} via ${account?.provider}`);
      
      // Update last login timestamp
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      }
    },
    
    // Event triggered on sign out
    async signOut({ token, session }) {
      console.log(`User signed out: ${token.email}`);
    },
  },
  
  debug: process.env.NODE_ENV === "development",
};

// Type declarations for NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image: string | null;
      currentWorkspaceId?: string;
      workspaceRole?: WorkspaceRole;
      workspaces?: Array<{
        id: string;
        name: string;
        slug: string;
        role: WorkspaceRole;
      }>;
    };
  }
  
  interface User {
    id: string;
    email: string;
    name: string;
    image: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    currentWorkspaceId?: string;
    workspaceRole?: WorkspaceRole;
    workspaces?: Array<{
      id: string;
      name: string;
      slug: string;
      role: WorkspaceRole;
    }>;
  }
}
