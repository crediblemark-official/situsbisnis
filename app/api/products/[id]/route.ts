import { createCrudHandler } from "@/lib/api/crud-handler";
import { productConfig } from "@/app/api/products/route";

const handler = createCrudHandler(productConfig);

export const GET = handler.detail.GET;
export const PATCH = handler.detail.PATCH;
export const PUT = handler.detail.PUT;
export const DELETE = handler.detail.DELETE;
