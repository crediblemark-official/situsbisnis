import { 
    countProducts, 
    getProductsMap, 
    searchProducts,
    getProducts,
    getProduct
} from "./services/catalog.service";

export * from "./actions/product.actions";

// Facade / Client kontrak publik
export const CatalogClient = {
    countProducts,
    getProductsMap,
    searchProducts,
    getProducts,
    getProduct
};
