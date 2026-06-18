"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import PageEditor from "@/modules/page/ui/dashboard/pages/PageEditor";

function NewPageContent() {
    const searchParams = useSearchParams();
    const isVisualMode = searchParams.get("mode") === "visual";

    return <PageEditor initialData={{
        id: "",
        path: "",
        title: "",
        description: "",
        imageUrl: "",
        body: "",
        isPublished: true,
        useBuilder: isVisualMode,
        data: null,
        metaData: [
            { key: "show_gallery", value: "false", type: "text" }
        ]
    }} />;
}

export default function NewPageRoute() {
    return (
        <Suspense fallback={<div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>}>
            <NewPageContent />
        </Suspense>
    );
}
