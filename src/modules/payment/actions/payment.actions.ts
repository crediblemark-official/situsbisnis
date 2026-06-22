"use server";

import { getApiContext } from "@/lib/api/utils";
import { PaymentClient } from "@/modules/payment";
import { db } from "@/modules/shared/core/db";

export async function updateTransactionStatusAction(body: { transactionId: string; status: string }) {
    try {
        const { session, error } = await getApiContext(["admin"]);
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const { transactionId, status } = body;
        if (!transactionId || !status) return { success: false, error: "Missing data" };

        // Cari transaksi terlebih dahulu untuk memvalidasi metode pembayaran
        const transaction = await db.paymentTransaction.findUnique({
            where: { id: transactionId }
        });
        if (!transaction) {
            return { success: false, error: "Transaction not found" };
        }

        if (transaction.paymentMethod !== "manual") {
            return { success: false, error: "Transaksi dengan Payment Gateway tidak dapat disetujui atau ditolak secara manual." };
        }

        let result;
        if (status === "approved") {
            result = await PaymentClient.processApprovedTransaction(transactionId);
        } else {
            result = await PaymentClient.updateTransactionStatus(transactionId, status);
        }

        return { success: true, result };
    } catch (err: any) {
        console.error("[UPDATE_TRANSACTION_STATUS_ACTION] Error:", err);
        if (err.message === "TRANSACTION_NOT_FOUND") {
            return { success: false, error: "Transaction not found" };
        }
        if (err.message === "ALREADY_PROCESSED") {
            return { success: false, error: "Transaction has already been processed" };
        }
        return { success: false, error: "Internal Error" };
    }
}

