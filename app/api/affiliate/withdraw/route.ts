import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/core/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
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

        const result = await db.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: session.user.id },
                select: { affiliateBalance: true }
            });

            if (!user) {
                throw new Error("USER_NOT_FOUND");
            }

            if (Number(user.affiliateBalance) < withdrawAmount) {
                throw new Error("INSUFFICIENT_BALANCE");
            }

            // Create the withdrawal record
            const withdrawal = await tx.withdrawal.create({
                data: {
                    userId: session.user.id,
                    amount: withdrawAmount,
                    bankName,
                    accountNumber,
                    accountName
                }
            });

            // Deduct the balance
            await tx.user.update({
                where: { id: session.user.id },
                data: {
                    affiliateBalance: {
                        decrement: withdrawAmount
                    }
                }
            });

            return withdrawal;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[AFFILIATE_WITHDRAW]", error);
        if (error.message === "INSUFFICIENT_BALANCE") {
            return new NextResponse("Saldo tidak mencukupi", { status: 400 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}
