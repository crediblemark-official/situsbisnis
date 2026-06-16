import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role?: string;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        role?: string;
    }
}

declare module "next-auth/jwt" {
    export interface JWT {
        id: string;
        role?: string;
    }
}

// Fix for PrismaAdapter / @auth/core compatibility
declare module "@auth/core/adapters" {
    export interface AdapterUser {
        role?: string;
    }
}
