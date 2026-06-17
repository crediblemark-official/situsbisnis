import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { IdentityClient } from "@/modules/auth";
import { NextResponse } from "next/server";
import { validateCsrf } from "@/modules/shared/utils/csrf";

export async function POST(req: Request) {
    try {
        const csrf = validateCsrf(req);
        if (!csrf.valid) {
            return new NextResponse("CSRF validation failed", { status: 403 });
        }

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { amount, bankName, accountNumber, accountName } = body;

        if (!amount || !bankName || !accountNumber || !accountName) {
            return new NextResponse("Data tidak lengkap", { status: 400 });
        }

        const withdrawAmount = Number(amount);
        if (isNaN(withdrawAmount) || withdrawAmount < 50000) {
            return new NextResponse("Minimal penarikan adalah Rp 50.000", { status: 400 });
        }

        const result = await IdentityClient.requestAffiliateWithdrawal(
            session.user.id,
            withdrawAmount,
            bankName,
            accountNumber,
            accountName
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[AFFILIATE_WITHDRAW]", error);
        if (error.message === "Saldo Anda tidak mencukupi untuk melakukan penarikan.") {
            return new NextResponse("Saldo tidak mencukupi", { status: 400 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

