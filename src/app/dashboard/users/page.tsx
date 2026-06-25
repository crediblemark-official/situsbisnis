import { IdentityClient } from "@/modules/auth";
import { getApiContext } from "@/lib/api/utils";
import UsersListClient from "@/modules/auth/ui/dashboard/users/UsersList.client";
import { getTenant } from "@/lib/domains/tenant";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { LinkButton } from "@/components/ui/LinkButton";

export default async function UsersPage() {
    const context = await getApiContext(["admin", "owner"]);
    
    if ("error" in context) {
        if (context.status === 401) {
            redirect("/login");
        }
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
                    <AlertCircle size={32} className="text-destructive" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Akses Ditolak</h2>
                <p className="text-muted-foreground text-sm mt-2 max-w-xs text-center">
                    Hanya pemilik situs yang dapat mengelola anggota tim.
                </p>
                <LinkButton href="/dashboard" className="mt-8">
                    Kembali ke Dashboard
                </LinkButton>
            </div>
        );
    }

    const { session, siteId } = context;

    const tenant = await getTenant();
    const isTenantContext = !!siteId && tenant !== null && tenant !== "admin";

    const { users } = await IdentityClient.getUsers(session.user.role, isTenantContext, siteId);

    return <UsersListClient initialUsers={users as any[]} />;
}