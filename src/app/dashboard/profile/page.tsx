import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/core/db";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/modules/auth/ui/dashboard/profile/profile-form";


export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/login");
    }

    const user = await db.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="w-full animate-in fade-in duration-700 pb-20">
            <div className="max-w-5xl mx-auto space-y-6">
                <ProfileForm user={user} />
            </div>
        </div>
    );
}
