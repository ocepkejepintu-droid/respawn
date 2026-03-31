# Real Buzzer Authentication System

Complete NextAuth.js v5 (Auth.js) authentication system with OAuth providers, email magic links, JWT sessions, and role-based workspace access.

## Features

- ✅ NextAuth.js v5 (beta) with App Router support
- ✅ OAuth providers: Google, GitHub
- ✅ Email magic link authentication
- ✅ JWT session strategy
- ✅ Role-based access control (OWNER, ADMIN, MEMBER)
- ✅ Middleware-based route protection
- ✅ Workspace context in sessions
- ✅ TypeScript types throughout

## Architecture

### File Structure

```
src/
├── lib/
│   ├── auth.ts              # Main auth utilities & helpers
│   ├── auth-options.ts      # NextAuth configuration & providers
│   └── prisma.ts            # Prisma client singleton
├── app/
│   ├── api/auth/[...nextauth]/route.ts  # Auth API endpoint
│   ├── (auth)/
│   │   ├── signin/page.tsx  # Sign-in page
│   │   └── layout.tsx       # Auth layout
│   └── layout.tsx           # Root layout with SessionProvider
├── components/
│   ├── auth/
│   │   ├── SignInButton.tsx    # OAuth sign-in buttons
│   │   ├── SignOutButton.tsx   # Sign-out button
│   │   ├── UserNav.tsx         # User dropdown navigation
│   │   ├── AuthGuard.tsx       # Route protection component
│   │   └── index.ts            # Exports
│   └── providers/
│       └── SessionProvider.tsx # NextAuth session provider
├── hooks/
│   └── use-auth.ts          # Auth hooks (useAuth, useWorkspace, etc.)
├── types/
│   └── auth.ts              # Auth TypeScript types
└── middleware.ts            # Route protection middleware
```

## Configuration

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```env
# NextAuth.js
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# Email Provider (SMTP)
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=xxx
EMAIL_SERVER_PASSWORD=xxx
EMAIL_FROM=noreply@realbuzzer.com
```

### Generating NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## Usage

### Sign In Components

```tsx
import { SignInButton, EmailSignInForm } from "@/components/auth";

// OAuth buttons
<SignInButton provider="google" />
<SignInButton provider="github" />

// Email magic link form
<EmailSignInForm />
```

### Navigation Components

```tsx
import { UserNav, SignOutButton } from "@/components/auth";

// Full user dropdown
<UserNav />

// Simple sign out
<SignOutButton />
```

### Route Protection

#### Using AuthGuard Component (Client-side)

```tsx
import { AuthGuard, PermissionGuard } from "@/components/auth";

// Basic auth guard
<AuthGuard>
  <DashboardContent />
</AuthGuard>

// Require specific role
<AuthGuard requiredRole="ADMIN">
  <AdminPanel />
</AuthGuard>

// Require any of multiple roles
<AuthGuard requiredRoles={["OWNER", "ADMIN"]}>
  <SettingsPanel />
</AuthGuard>

// Permission-based component
<PermissionGuard permission={["OWNER", "ADMIN"]}>
  <ManageMembersButton />
</PermissionGuard>
```

#### Using Hooks

```tsx
import { useAuth, useWorkspace, usePermission } from "@/hooks/use-auth";

// Auth hook
const { user, isAuthenticated, login, logout, switchWorkspace } = useAuth();

// Workspace context
const { 
  currentWorkspace, 
  workspaces, 
  setActiveWorkspace,
  isOwner,
  isAdmin,
  can: { manageSettings, manageBilling }
} = useWorkspace();

// Permission checks
const { checkPermission, isOwner } = usePermission();
if (checkPermission("ADMIN")) { /* ... */ }
```

### Middleware Protection (Server-side)

The middleware automatically protects routes:

```typescript
// middleware.ts
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/protected/:path*",
    "/settings/:path*",
  ],
};
```

Protected routes will:
1. Redirect unauthenticated users to `/signin`
2. Redirect users without workspace to `/onboarding`
3. Check role permissions for admin/owner routes

### Server-side Auth

```tsx
import { auth, getCurrentUser, checkWorkspaceAccess } from "@/lib/auth";

// In server components/API routes
export default async function Page() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/signin");
  }
  
  // Check workspace access
  const access = await checkWorkspaceAccess(["OWNER", "ADMIN"]);
  if (!access.allowed) {
    redirect("/dashboard");
  }
  
  return <div>Protected content</div>;
}
```

## Role-Based Access Control

### Role Hierarchy

```
OWNER (3) > ADMIN (2) > MEMBER (1)
```

### Permissions Matrix

| Feature | OWNER | ADMIN | MEMBER |
|---------|-------|-------|--------|
| View Workspace | ✅ | ✅ | ✅ |
| Manage Settings | ✅ | ✅ | ❌ |
| Manage Members | ✅ | ✅ | ❌ |
| Invite Members | ✅ | ✅ | ❌ |
| View Analytics | ✅ | ✅ | ❌ |
| Manage Billing | ✅ | ❌ | ❌ |
| Delete Workspace | ✅ | ❌ | ❌ |
| Transfer Ownership | ✅ | ❌ | ❌ |

## Session Structure

```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    image: string | null;
    currentWorkspaceId: string;      // Active workspace
    workspaceRole: "OWNER" | "ADMIN" | "MEMBER";
    workspaces: [                    // All accessible workspaces
      { id, name, slug, role }
    ];
  };
  expires: string;
}
```

## Workspace Flow

1. **New User Sign Up**:
   - User signs in via OAuth or email
   - System automatically creates personal workspace
   - User becomes OWNER of their workspace

2. **Switching Workspaces**:
   ```tsx
   const { switchWorkspace } = useAuth();
   await switchWorkspace("workspace-id");
   ```

3. **Inviting Members**:
   - OWNER/ADMIN can invite users to workspace
   - Invited users get MEMBER role by default
   - Users can belong to multiple workspaces

## API Integration

Protected API routes can access auth headers:

```typescript
// Headers set by middleware
const userId = headers().get("x-user-id");
const workspaceId = headers().get("x-workspace-id");
const role = headers().get("x-workspace-role");
```

## Troubleshooting

### Common Issues

1. **Session not persisting**: Check `NEXTAUTH_SECRET` is set
2. **OAuth callback fails**: Verify `NEXTAUTH_URL` matches your domain
3. **Email not sending**: Check SMTP credentials in environment variables
4. **TypeScript errors**: Ensure `@auth/prisma-adapter` is installed

### Debug Mode

Enable debug logging in development:
```typescript
// auth-options.ts
debug: process.env.NODE_ENV === "development",
```

## Dependencies

```json
{
  "next-auth": "^5.0.0-beta.x",
  "@auth/prisma-adapter": "^2.x"
}
```

To upgrade to NextAuth v5 beta:
```bash
npm install next-auth@beta @auth/prisma-adapter@latest
```
