import { countProductsInternal } from "./actions";

// Facade / Client kontrak publik
export const CatalogClient = {
    countProducts: countProductsInternal
};
