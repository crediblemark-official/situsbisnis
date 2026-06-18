import { PageClient } from "@/modules/page";
import { getApiContext } from "@/lib/api/utils";
import MenuListClient from "@/modules/page/ui/dashboard/menus/MenuList.client";
import { redirect } from "next/navigation";

export default async function MenusPage() {
    const { session, siteId, error } = await getApiContext(["admin", "owner", "editor"]);

    if (error || !session || !siteId) {
        redirect("/login");
    }

    let pages: any[] = [];
    let menu: any = null;
    let hasError = false;

    try {
        const [fetchedPages, fetchedMenu] = await Promise.all([
            PageClient.getPages(siteId),
            PageClient.getMenu("main", siteId)
        ]);
        pages = fetchedPages;
        menu = fetchedMenu;
    } catch (err) {
        console.error("Error loading menus dashboard:", err);
        hasError = true;
    }

    if (hasError) {
        return (
            <div className="p-8 text-center text-red-500 font-bold">
                Gagal memuat data menu navigasi.
            </div>
        );
    }

    return (
        <MenuListClient 
            initialPages={pages as any[]} 
            initialMenu={menu} 
        />
    );
}
