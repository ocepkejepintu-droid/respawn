"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import { useState } from "react";

interface SignOutButtonProps {
  callbackUrl?: string;
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "warning" | "success" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function SignOutButton({
  callbackUrl = "/",
  className,
  variant = "ghost",
  size = "default",
  showIcon = true,
  children,
}: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut({
        callbackUrl,
        redirect: true,
      });
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSignOut}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : showIcon ? (
        <LogOut className="mr-2 h-4 w-4" />
      ) : null}
      {children || "Sign Out"}
    </Button>
  );
}

// Sign out with confirmation dialog
interface ConfirmSignOutButtonProps extends SignOutButtonProps {
  confirmTitle?: string;
  confirmDescription?: string;
}

export function ConfirmSignOutButton({
  confirmTitle = "Sign Out",
  confirmDescription = "Are you sure you want to sign out?",
  ...props
}: ConfirmSignOutButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <SignOutButton {...props} />
      
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 shadow-lg max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold">{confirmTitle}</h3>
            <p className="mt-2 text-sm text-gray-600">{confirmDescription}</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </Button>
              <SignOutButton {...props} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
