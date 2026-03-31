import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    // GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
    // Credentials (for testing/development)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null

        // Find or create user (development only!)
        let user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          // Auto-create user in development
          user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split('@')[0],
            },
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token && session.user) {
        session.user.id = token.sub as string
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture as string | undefined
      }
      return session
    },
    async jwt({ token, user, account, profile }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          sub: user.id,
          name: user.name,
          email: user.email,
          picture: user.image,
        }
      }
      return token
    },
  },
  events: {
    async createUser({ user }) {
      // Create a default workspace for new users
      if (user.email) {
        const slug = `personal-${user.id.slice(-8)}`
        
        await prisma.workspace.create({
          data: {
            name: `${user.name || user.email.split('@')[0]}'s Workspace`,
            slug,
            ownerId: user.id,
            members: {
              create: {
                userId: user.id,
                role: 'OWNER',
              },
            },
            subscription: {
              create: {
                tier: 'FREE',
                status: 'ACTIVE',
                maxCompetitors: 3,
                maxHashtagTracks: 5,
                maxScrapedPosts: 1000,
                maxAnalysisReports: 5,
                maxTeamMembers: 1,
              },
            },
          },
        })
      }
    },
  },
}
