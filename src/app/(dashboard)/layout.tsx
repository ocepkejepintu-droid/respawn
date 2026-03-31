import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { authOptions } from "@/lib/auth-options";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image ?? undefined,
  };

  const workspaces =
    session.user.workspaces?.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
    })) ?? [];

  return (
    <DashboardShell
      user={user}
      workspaces={workspaces}
      currentWorkspace={session.user.currentWorkspaceId}
      notifications={[]}
    >
      {children}
    </DashboardShell>
  );
}
