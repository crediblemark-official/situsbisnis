import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/core/db";
import bcrypt from "bcryptjs";

function generateReferralCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: Request) {
    try {
        const { email, password, name, phone, referralCode: reqReferralCode } = await req.json();

        let referralCode = reqReferralCode;
        if (!referralCode) {
            const cookieStore = await cookies();
            referralCode = cookieStore.get("situsbisnis_ref_code")?.value;
        }

        if (!email || !password) {
            return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
        }

        if (!phone || typeof phone !== "string" || phone.trim() === "") {
            return NextResponse.json({ error: "Nomor HP wajib diisi" }, { status: 400 });
        }

        // Clean to digits only for standardization (suitable for StarSender)
        let formattedPhone = phone.replace(/[^0-9]/g, "");
        if (formattedPhone.startsWith("0")) {
            formattedPhone = "62" + formattedPhone.slice(1);
        } else if (formattedPhone.startsWith("8")) {
            formattedPhone = "62" + formattedPhone;
        }

        const isIndonesian = /^628[1-9]\d{7,11}$/.test(formattedPhone);
        const isInternational = /^[1-9]\d{8,14}$/.test(formattedPhone) && !formattedPhone.startsWith("628");

        if (!isIndonesian && !isInternational) {
            return NextResponse.json({ 
                error: "Nomor HP tidak valid. Gunakan format yang benar (contoh: 0812xxx atau +62812xxx)" 
            }, { status: 400 });
        }

        // 1. Check if user exists by email
        const existingUser = await db.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
        }

        // Check if phone number exists
        const existingPhone = await db.user.findUnique({
            where: { phone: formattedPhone }
        });

        if (existingPhone) {
            return NextResponse.json({ error: "Nomor HP sudah terdaftar" }, { status: 400 });
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Check and resolve referral code
        let referredById = null;
        if (referralCode) {
            const referrer = await db.user.findUnique({
                where: { referralCode }
            });
            if (referrer) {
                referredById = referrer.id;
            }
        }

        // 4. Generate unique referral code for this user
        let newReferralCode = generateReferralCode();
        let codeExists = true;
        while (codeExists) {
            const existingCode = await db.user.findUnique({ where: { referralCode: newReferralCode }});
            if (!existingCode) {
                codeExists = false;
            } else {
                newReferralCode = generateReferralCode();
            }
        }

        // 5. Create user
        const user = await db.user.create({
            data: {
                email,
                phone: formattedPhone,
                password: hashedPassword,
                name: name || email.split("@")[0],
                role: "owner", // Default SaaS user role
                referralCode: newReferralCode,
                referredById
            }
        });

        // Send welcome email in the background
        if (user.email) {
            const { sendWelcomeEmail } = await import("@/lib/services/email");
            sendWelcomeEmail(user.email, user.name || "Pengguna", "SitusBisnis").catch(err => {
                console.error("[WELCOME_EMAIL_ERROR] Failed to send welcome email:", err);
            });
        }

        return NextResponse.json({ 
            success: true, 
            user: { id: user.id, email: user.email, name: user.name, referralCode: user.referralCode } 
        });

    } catch (error) {
        console.error("[REGISTER_API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
