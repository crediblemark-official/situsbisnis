import { z } from "zod";
import { Prisma, Role } from "@prisma/client";

export interface CrudHandlerConfig<T extends z.ZodType<any, any> = z.ZodType<any, any>> {
    model: Uncapitalize<Prisma.ModelName>;
    schema?: T;
    roles?: Role[];
    limitCheckType?: string;
    idField?: string;
    includeArchivedLogic?: boolean;
    transformData?: (data: z.infer<T>, session: any) => any;
    isPublicGet?: boolean;
    listSelect?: any;
}

export interface CrudHandler {
    collection: {
        GET: (req: Request) => Promise<Response>;
        POST: (req: Request) => Promise<Response>;
    };
    detail: {
        GET: (req: Request, { params }: { params: Promise<{ id: string }> }) => Promise<Response>;
        PATCH: (req: Request, { params }: { params: Promise<{ id: string }> }) => Promise<Response>;
        PUT: (req: Request, { params }: { params: Promise<{ id: string }> }) => Promise<Response>;
        DELETE: (req: Request, { params }: { params: Promise<{ id: string }> }) => Promise<Response>;
    };
}
