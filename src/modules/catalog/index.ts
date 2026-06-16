import { countProductsInternal, getProductsMapInternal } from "./actions";

// Facade / Client kontrak publik
export const CatalogClient = {
    countProducts: countProductsInternal,
    getProductsMap: getProductsMapInternal
};
