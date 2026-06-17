import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { IdentityClient } from "@/modules/auth";
import { validateCsrf } from "@/modules/shared/utils/csrf";

export async function POST(req: Request) {
    try {
        const csrf = validateCsrf(req);
        if (!csrf.valid) {
            return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
        }

        const body = await req.json();
        const cookieStore = await cookies();
        const referralCodeFromCookie = cookieStore.get("situsbisnis_ref_code")?.value;

        try {
            const user = await IdentityClient.registerUser(body, referralCodeFromCookie);
            return NextResponse.json({ success: true, user });
        } catch (err: any) {
            return NextResponse.json({ error: err.message }, { status: 400 });
        }
    } catch (error) {
        console.error("[REGISTER_API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

