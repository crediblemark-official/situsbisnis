import { IdentityClient } from "@/modules/auth";
import { getApiContext } from "@/lib/api/utils";
import UsersListClient from "@/modules/auth/ui/dashboard/users/UsersList.client";
import { getTenant } from "@/lib/domains/tenant";
import { redirect } from "next/navigation";

export default async function UsersPage() {
    const { session, siteId, error } = await getApiContext(["admin", "owner", "editor"]);
    
    if (error || !session) {
        redirect("/login");
    }

    const tenant = await getTenant();
    const isTenantContext = !!siteId && tenant !== null && tenant !== "admin";

    const { users } = await IdentityClient.getUsers(session.user.role, isTenantContext, siteId);

    return <UsersListClient initialUsers={users as any[]} />;
}