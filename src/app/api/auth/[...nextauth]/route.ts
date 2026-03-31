import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-options";

// NextAuth.js v5 API Route Handler
// This uses the App Router pattern for Next.js 13+

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
