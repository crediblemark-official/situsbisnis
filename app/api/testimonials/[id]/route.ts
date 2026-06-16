import { createCrudHandler } from "@/lib/api/crud-handler";
import { testimonialConfig } from "@/app/api/testimonials/route";

const handler = createCrudHandler(testimonialConfig);

export const GET = handler.detail.GET;
export const PATCH = handler.detail.PATCH;
export const PUT = handler.detail.PUT;
export const DELETE = handler.detail.DELETE;
