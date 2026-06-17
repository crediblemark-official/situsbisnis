import { createCrudHandler } from "./controllers/crud.controller";
export type { CrudHandlerConfig, CrudHandler } from "./crud.types";

export const CrudClient = {
    createHandler: createCrudHandler,
};
