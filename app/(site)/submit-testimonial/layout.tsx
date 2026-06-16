import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Submit Testimonial",
    description: "Share your experience with us.",
};

export default function SubmitTestimonialLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
