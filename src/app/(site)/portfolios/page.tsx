import { getPortfolios } from "@/modules/page/ui/content-display";
import { LayoutGrid } from "lucide-react";
import { Metadata } from "next";
import PortfolioList from "./portfolio-list";


export const metadata: Metadata = {
    title: "Portfolio",
    description: "Discover our collection of published books, academic journals, and research works.",
};

export default async function PortfoliosPage() {
    const portfolios = await getPortfolios();

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="bg-background border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-20 lg:px-8">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-2 text-blue-600 font-semibold mb-4">
                            <LayoutGrid size={20} />
                            <span>OUR WORK</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl mb-6">
                            Showcasing Our <span className="text-blue-600">Greatest Milestones</span>
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            A curated selection of the impactful publications and collaborative projects we&apos;ve brought to life.
                        </p>
                    </div>
                </div>
            </section>

            {/* List Section */}
            <section className="max-w-7xl mx-auto px-6 py-12 lg:px-8">
                <PortfolioList initialItems={portfolios} />
            </section>
        </div>
    );
}
