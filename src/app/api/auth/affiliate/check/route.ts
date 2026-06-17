import { IdentityClient } from "@/modules/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");

        if (!code) {
            return new NextResponse("Code is required", { status: 400 });
        }

        const result = await IdentityClient.checkReferralCode(code);

        if (!result.exists) {
            return NextResponse.json({ exists: false });
        }

        return NextResponse.json({ exists: true, name: result.name });
    } catch (error) {
        console.error("[AFFILIATE_CHECK]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

