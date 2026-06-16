import { countProductsInternal, getProductsMapInternal, searchProductsInternal } from "./actions";

// Facade / Client kontrak publik
export const CatalogClient = {
    countProducts: countProductsInternal,
    getProductsMap: getProductsMapInternal,
    searchProducts: searchProductsInternal
};
