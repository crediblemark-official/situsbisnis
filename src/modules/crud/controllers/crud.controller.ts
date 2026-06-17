import { z } from "zod";
import { createCrudHandler as createCrudHandlerService } from "../services/crud.service";
import type { CrudHandlerConfig, CrudHandler } from "../crud.types";

export function createCrudHandler<T extends z.ZodType<any, any>>(config: CrudHandlerConfig<T>): CrudHandler {
    return createCrudHandlerService(config);
}
