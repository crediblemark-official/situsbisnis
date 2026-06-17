import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/core/db";
import bcrypt from "bcryptjs";

const maskEmail = (email?: string) => {
    if (!email) return "";
    const [local, domain] = email.split('@');
    if (!domain) return email;
    return `${local.slice(0, 2)}***@${domain}`;
};

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db),
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
    cookies: (() => {
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.replace(/^https?:\/\//, '').split(':')[0];
        const isProduction = process.env.NODE_ENV === 'production';
        // Share cookies across subdomains in production OR in development if using a custom root domain (not localhost)
        const isLocalhost = !rootDomain || rootDomain.includes("localhost") || rootDomain.includes("127.0.0.1");
        const cookieDomain = (!isLocalhost && rootDomain) ? `.${rootDomain}` : undefined;
        
        // Detect if we should use secure cookies (based on whether NEXTAUTH_URL is HTTPS)
        const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://") || isProduction;
        const cookiePrefix = useSecureCookies ? '__Secure-' : '';

        return {
            sessionToken: {
                name: `${cookiePrefix}next-auth.session-token`,
                options: {
                    httpOnly: true,
                    sameSite: 'lax' as const,
                    path: '/',
                    secure: useSecureCookies,
                    domain: cookieDomain,
                }
            },
        };
    })(),
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "admin@example.com" },
                password: { label: "Password", type: "password" }
            },
            // ... inside provider ...
            async authorize(credentials) {
                const email = credentials?.email?.toLowerCase().trim();
                const maskedEmail = maskEmail(email);
                console.log(`[AUTH] Attempting login for: '${maskedEmail}'`);

                if (!email || !credentials?.password) {
                    console.log("[AUTH] Missing credentials");
                    return null;
                }

                const user = await db.user.findUnique({
                    where: { email: email }
                });

                if (!user || !user.password) {
                    console.log("[AUTH] User search result for", maskedEmail, ":", user ? "FOUND (but no PWD)" : "NOT FOUND");
                    throw new Error("Email atau password salah.");
                }

                const passwordsMatch = await bcrypt.compare(credentials.password, user.password);

                if (passwordsMatch) {
                    console.log("[AUTH] Success:", maskEmail(user.email), user.role, "ID:", user.id);
                    return user;
                }

                console.log("[AUTH] Password mismatch for:", maskEmail(user.email));
                throw new Error("Email atau password salah.");
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = (user as any).id;
                token.role = (user as any).role;
                token.name = user.name;
                token.email = user.email;
            }
            if (trigger === "update" && session?.name) {
                token.name = session.name;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = (token.id || token.sub) as string;
                (session.user as any).role = token.role as string;
                session.user.name = token.name as string;
                session.user.email = token.email as string;
            }
            return session;
        },
    },
};
