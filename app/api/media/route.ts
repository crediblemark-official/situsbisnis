import { db } from "@/lib/core/db";
import { uploadToR2 } from "@/lib/media/r2";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { BillingClient } from "@/lib/modules/billing/client";
import sharp from "sharp";
import path from "path";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { siteId, error, status } = await getApiContext();
        if (error) return apiError(error, status);

        const { searchParams } = new URL(req.url);
        const folderId = searchParams.get("folderId") || null;
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "50")));
        const skip = (page - 1) * limit;

        const whereCondition = {
            siteId,
            folderId: folderId === "root" ? null : folderId
        };

        const [items, total, totalSizeResult, subscription] = await Promise.all([
            db.mediaItem.findMany({
                where: whereCondition,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: skip,
                select: {
                    id: true,
                    url: true,
                    filename: true,
                    mimeType: true,
                    size: true,
                    createdAt: true,
                    folderId: true,
                }
            }),
            db.mediaItem.count({ where: { siteId } }),
            db.mediaItem.aggregate({
                where: { siteId },
                _sum: {
                    size: true
                }
            }),
            db.subscription.findFirst({
                where: { siteId, status: "active" },
                include: { plan: true }
            })
        ]);

        const plan = subscription?.plan as any;
        const hasGallery = plan?.features?.hasGallery === true;
        const maxAssets = hasGallery ? (plan?.maxAssets ?? -1) : 0;

        const totalBytes = totalSizeResult._sum.size || 0;
        const totalSizeInMb = totalBytes / (1024 * 1024);

        return apiResponse({
            data: items,
            quota: {
                used: totalSizeInMb,
                max: maxAssets
            },
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("GET Media Error:", error);
        return apiError("Internal Error");
    }
}

export async function POST(req: Request) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const folderId = formData.get("folderId") as string | null;

        if (!file) return apiError("File required", 400);
        
        // 1. Check Max Assets Limit (Centralized - now checks hasGallery too)
        const limitCheck = await BillingClient.checkSiteLimit(siteId, "maxAssets");
        if (!limitCheck.allowed) {
            return apiError(limitCheck.message || "Quota full", 403);
        }

        // Validation
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = path.extname(file.name).toLowerCase();
        const isImage = [".jpg", ".jpeg", ".png", ".webp"].includes(ext);

        let url = "";
        let width, height, blurDataURL;
        let finalBuffer: Buffer = buffer;
        let finalMimeType = file.type;
        let finalFilename = file.name;
        let finalSize = file.size;

        if (isImage) {
            try {
                const image = sharp(buffer);
                await image.metadata();
                
                // 1. Auto-optimize and convert to WebP
                // We also auto-resize to a maximum width of 2560px for sanity
                const optimizedImage = image
                    .resize(2560, undefined, { withoutEnlargement: true, fit: "inside" })
                    .webp({ quality: 80, effort: 4 })
                    .rotate();

                finalBuffer = await optimizedImage.toBuffer() as Buffer;
                
                // Update metadata based on the processed image
                const processedMetadata = await sharp(finalBuffer).metadata();
                width = processedMetadata.width;
                height = processedMetadata.height;
                
                // Update file info for database
                finalMimeType = "image/webp";
                finalFilename = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                finalSize = finalBuffer.length;

                // 2. Generate tiny low-res placeholder (keep it extremely small)
                const placeholder = await image
                    .resize(10, 10, { fit: "inside" })
                    .jpeg({ quality: 20, progressive: true })
                    .toBuffer();
                blurDataURL = `data:image/jpeg;base64,${placeholder.toString("base64")}`;
            } catch (err) {
                console.error("Image processing failed:", err);
                // Fallback to original buffer if sharp fails
            }
        }

        const uploadName = `${Date.now()}-${finalFilename.replace(/\s+/g, "-")}`;
        url = await uploadToR2(finalBuffer, uploadName, finalMimeType);

        if (!url) return apiError("Upload failed", 500);

        const mediaItem = await db.mediaItem.create({
            data: {
                site: { connect: { id: siteId } },
                folder: folderId && folderId !== "root" ? { connect: { id: folderId } } : undefined,
                url,
                filename: finalFilename,
                mimeType: finalMimeType,
                size: finalSize,
                width,
                height,
                blurDataURL,
            }
        });

        return apiResponse(mediaItem);
    } catch (error) {
        console.error("Upload Error:", error);
        return apiError("Internal Error");
    }
}
