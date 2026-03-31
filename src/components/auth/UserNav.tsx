"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton } from "./SignOutButton";
import { Building, Settings, User, Users } from "lucide-react";

interface UserNavProps {
  showWorkspaceSwitcher?: boolean;
}

export function UserNav({ showWorkspaceSwitcher = true }: UserNavProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/signin">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  const { user } = session;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0].toUpperCase() || "U";

  const currentWorkspace = user.workspaces?.find(
    (w) => w.id === user.currentWorkspaceId
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image || ""} alt={user.name || ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {currentWorkspace && (
              <p className="text-xs leading-none text-muted-foreground mt-1">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {currentWorkspace.name}
                </span>
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings/profile">
              <User className="mr-2 h-4 w-4" />
              Profile
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          
          {showWorkspaceSwitcher && user.workspaces && user.workspaces.length > 1 && (
            <>
              <DropdownMenuItem asChild>
                <Link href="/settings/workspaces">
                  <Building className="mr-2 h-4 w-4" />
                  Switch Workspace
                  <span className="ml-auto text-xs text-muted-foreground">
                    {user.workspaces.length}
                  </span>
                </Link>
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuItem asChild>
            <Link href="/settings/workspace">
              <Settings className="mr-2 h-4 w-4" />
              Workspace Settings
            </Link>
          </DropdownMenuItem>
          
          {(user.workspaceRole === "OWNER" || user.workspaceRole === "ADMIN") && (
            <DropdownMenuItem asChild>
              <Link href="/settings/workspace/members">
                <Users className="mr-2 h-4 w-4" />
                Members
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <SignOutButton variant="ghost" className="w-full justify-start" showIcon={false}>
            Log out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </SignOutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simpler user button without dropdown
export function UserButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Avatar className="h-8 w-8">
        <AvatarFallback className="animate-pulse bg-gray-200">...</AvatarFallback>
      </Avatar>
    );
  }

  if (!session?.user) {
    return (
      <Link href="/signin">
        <Button variant="outline" size="sm">
          Sign In
        </Button>
      </Link>
    );
  }

  const { user } = session;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0].toUpperCase() || "U";

  return (
    <Link href="/settings/profile">
      <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary">
        <AvatarImage src={user.image || ""} alt={user.name || ""} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    </Link>
  );
}
