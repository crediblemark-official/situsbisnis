import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBridgeSessionApi, acceptBridgeSessionApi } from "@/modules/auth/controllers/auth-api.controller";

const handler = NextAuth(authOptions);

async function handleAuthRoute(req: Request, { params }: { params: Promise<{ nextauth: string[] }> }) {
    const { nextauth } = await params;
    const [action] = nextauth;

    if (action === "bridge") {
        if (nextauth.length === 1) return getBridgeSessionApi(req as any);
        if (nextauth.length === 2 && nextauth[1] === "accept") return acceptBridgeSessionApi(req as any);
    }

    return handler(req, { params: params as any });
}

export { handleAuthRoute as GET, handler as POST };
