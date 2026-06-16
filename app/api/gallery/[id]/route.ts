import { createCrudHandler } from "@/lib/api/crud-handler";
import { galleryConfig } from "@/app/api/gallery/route";

const handler = createCrudHandler(galleryConfig);

export const GET = handler.detail.GET;
export const PATCH = handler.detail.PATCH;
export const PUT = handler.detail.PUT;
export const DELETE = handler.detail.DELETE;
