import { createCrudHandler } from "@/lib/api/crud-handler";
import { postConfig } from "@/app/api/posts/route";

const handler = createCrudHandler(postConfig);

export const GET = handler.detail.GET;
export const PATCH = handler.detail.PATCH;
export const PUT = handler.detail.PUT;
export const DELETE = handler.detail.DELETE;
