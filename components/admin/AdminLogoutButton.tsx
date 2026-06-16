"use client";

import React from "react";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function AdminLogoutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign Out"
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
        >
            <LogOut size={16} />
        </button>
    );
}
