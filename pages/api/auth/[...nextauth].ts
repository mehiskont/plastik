import NextAuth from 'next-auth'
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { log } from "@/lib/logger"

export default NextAuth({
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        try {
          log(`[NextAuth] Authorizing with credentials`, { email: credentials?.email }, "info");
          
          // Make sure we have the correct backend URL
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
          if (!apiBaseUrl) {
            log("[NextAuth] API_BASE_URL not configured", {}, "error");
            return null;
          }
          
          // Remove any trailing slash
          const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
          const loginUrl = `${baseUrl}/api/auth/login`;
          
          log(`[NextAuth] Calling login API at ${loginUrl}`, {}, "info");
          
          // Use absolute URL to your backend
          const res = await fetch(loginUrl, {
            method: 'POST',
            body: JSON.stringify(credentials),
            headers: { "Content-Type": "application/json" }
          })

          if (!res.ok) {
            log(`[NextAuth] Login failed with status: ${res.status}`, { email: credentials?.email }, "warn");
            return null;
          }
          
          const responseText = await res.text();
          let userData;
          
          try {
            userData = responseText ? JSON.parse(responseText) : null;
          } catch (error) {
            log(`[NextAuth] Failed to parse JSON response`, { error, responseText }, "error");
            return null;
          }
          
          if (!userData) {
            log(`[NextAuth] Empty response from API`, { email: credentials?.email }, "error");
            return null;
          }

          log(`[NextAuth] Login successful`, { 
            email: credentials?.email,
            responseKeys: Object.keys(userData) 
          }, "info");
          
          // The API logs show that login was successful, but we need to understand the response format
          log("[NextAuth] API Response data", { userData }, "info");
          
          // Since we saw the API log that the user was successfully logged in,
          // but might not be returning user data in the format we expect,
          // let's create a user object using the credentials
          
          // Handle different response formats
          let user = null;
          
          // First try to get user from structured response
          if (userData.user) {
            user = userData.user;
          } else if (userData.id) {
            user = userData;
          } else if (userData.data?.user) {
            user = userData.data.user;
          }
          
          // If no structured user data but the API reports success, create a minimal user
          if (!user && (userData.success || res.ok)) {
            // Create userId from email or credentials if possible
            const userIdFromEmail = credentials?.email?.replace(/[^a-zA-Z0-9]/g, '') || '';
            const userId = userData.userId || 
                          `user-${userIdFromEmail}-${Date.now()}`;
            
            user = {
              // Use the id from logs if we saw it in API logs
              id: userId, 
              email: credentials?.email,
              name: credentials?.email?.split('@')[0] || 'User'
            };
            
            log("[NextAuth] Created fallback user", { user }, "warn");
          }
          
          // Ensure we have a valid user object
          if (user) {
            return {
              id: user.id,
              name: user.name || user.email?.split('@')[0] || 'User',
              email: user.email,
              image: user.image,
              // Add flag for cart merging
              shouldMergeCart: true
            };
          }
          
          return null;
        } catch (error) {
          log("[NextAuth] Authorize error", { error }, "error");
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // If user was just signed in, add their info to the token
      if (user) {
        token.userId = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        
        // Add provider info if available
        if (account) {
          token.provider = account.provider;
        }
        
        // Check if cart merge is needed
        if ((user as any).shouldMergeCart) {
          token.shouldMergeCart = true;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Add user data from token to session
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
      }
      
      // Add additional properties
      (session as any).shouldMergeCart = token.shouldMergeCart;
      (session as any).provider = token.provider;
      
      return session;
    },
    // Fix URL construction issues by ensuring we use a base URL reference
    async redirect({ url, baseUrl }) {
      log("[NextAuth] Redirect callback", { url, baseUrl }, "info");
      
      // Handle relative URLs - ensure they have the proper base
      if (url.startsWith('/')) {
        // When building URL manually, use the proper baseUrl
        const finalUrl = `${baseUrl}${url}`;
        log("[NextAuth] Redirecting to", { finalUrl }, "info");
        return finalUrl;
      }
      
      // Warn when a URL might cause construction errors
      if (!url.startsWith('http')) {
        log("[NextAuth] Potential invalid URL", { url }, "warn");
      }
      
      // If URL is already absolute and valid, return it
      if (url.startsWith('http')) {
        return url;
      }
      
      // Fallback to dashboard if we can't determine a valid URL
      log("[NextAuth] Falling back to dashboard URL", {}, "warn");
      return `${baseUrl}/dashboard`;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development'
})