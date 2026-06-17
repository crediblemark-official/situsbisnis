import { getSiteId } from "@/lib/domains/tenant";
import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { SiteClient } from "@/modules/site";
import { z } from "zod";

const contactFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    subject: z.string().optional().default("No Subject"),
    message: z.string().min(1, "Message is required"),
    emailTo: z.string().email("Invalid destination email").optional(),
});

/**
 * POST /api/contact
 * Menyimpan pesan dari formulir kontak publik.
 */
export async function POST(req: Request) {
    try {
        const siteId = await getSiteId();
        if (!siteId) {
            return apiError("Site context required", 400);
        }
        
        const { data, error, details, status } = await validateBody(req, contactFormSchema);
        if (error) return apiError(error, status, details);

        const { emailTo: _emailTo, ...submissionData } = data;

        await SiteClient.createContactSubmission(siteId, submissionData);

        return apiResponse({ success: true, message: "Message sent successfully" });
    } catch (error) {
        console.error("Contact Form Error:", error);
        return apiError("Internal Error");
    }
}

/**
 * GET /api/contact
 * Mengambil daftar pesan formulir kontak (admin/owner saja).
 */
export async function GET(_req: Request) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const submissions = await SiteClient.getContactSubmissions(siteId);
        return apiResponse(submissions);
    } catch (error) {
        console.error("Fetch Submissions Error:", error);
        return apiError("Internal Error");
    }
}
