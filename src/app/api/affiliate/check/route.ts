import { db } from "@/lib/core/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");

        if (!code) {
            return new NextResponse("Code is required", { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { referralCode: code },
            select: { name: true }
        });

        if (!user) {
            return NextResponse.json({ exists: false });
        }

        return NextResponse.json({ exists: true, name: user.name });
    } catch (error) {
        console.error("[AFFILIATE_CHECK]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
