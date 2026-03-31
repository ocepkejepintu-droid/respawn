"use client";

import { useSearchParams } from "next/navigation";
import { SignInButton, EmailSignInForm } from "@/components/auth";
import { Suspense } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Sign in to Real Buzzer
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Please sign in to continue.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Authentication Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error === "OAuthSignin" && "Error starting OAuth sign in."}
                  {error === "OAuthCallback" && "Error completing OAuth sign in."}
                  {error === "OAuthCreateAccount" && "Error creating OAuth account."}
                  {error === "EmailCreateAccount" && "Error creating email account."}
                  {error === "Callback" && "Error in authentication callback."}
                  {error === "OAuthAccountNotLinked" &&
                    "Email already exists with different provider."}
                  {error === "EmailSignin" && "Error sending email sign in link."}
                  {error === "CredentialsSignin" && "Invalid credentials."}
                  {error === "SessionRequired" && "Please sign in to access this page."}
                  {!error && "An unknown error occurred."}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <SignInButton
            provider="google"
            callbackUrl={callbackUrl}
            className="w-full"
            variant="outline"
          />

          <SignInButton
            provider="github"
            callbackUrl={callbackUrl}
            className="w-full"
            variant="outline"
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 px-2 text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

          <EmailSignInForm callbackUrl={callbackUrl} />
        </div>

        <p className="text-center text-xs text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
