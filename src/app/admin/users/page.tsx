import React from "react";
import UserList from "./UserList";
import { IdentityClient } from "@/modules/auth";

export const dynamic = "force-dynamic";

export default async function UserManagementPage() {
    const users = await IdentityClient.getAdminUsersContext();

    return <UserList initialUsers={users as any} />;
}
