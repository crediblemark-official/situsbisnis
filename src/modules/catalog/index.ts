import { countProductsInternal, getProductsMapInternal, searchProductsInternal } from "./controllers/catalog.controller";

// Facade / Client kontrak publik
export const CatalogClient = {
    countProducts: countProductsInternal,
    getProductsMap: getProductsMapInternal,
    searchProducts: searchProductsInternal
};
