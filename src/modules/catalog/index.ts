import { 
    countProductsInternal, 
    getProductsMapInternal, 
    searchProductsInternal,
    getProductsInternal,
    getProductInternal
} from "./controllers/catalog.controller";

// Facade / Client kontrak publik
export const CatalogClient = {
    countProducts: countProductsInternal,
    getProductsMap: getProductsMapInternal,
    searchProducts: searchProductsInternal,
    getProducts: getProductsInternal,
    getProduct: getProductInternal
};
