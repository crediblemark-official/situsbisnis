import {
    countProducts,
    getProductsMap,
    searchProducts,
    getProducts,
    getProduct
} from "./services/catalog.service";

import {
    listProducts,
    createProduct,
    getProductDetail,
    updateProduct,
    deleteProductItem,
    archiveProduct
} from "./services/product.service";

export const CatalogClient = {
    countProducts,
    getProductsMap,
    searchProducts,
    getProducts,
    getProduct,
    listProducts,
    createProduct,
    getProductDetail,
    updateProduct,
    deleteProduct: deleteProductItem,
    archiveProduct,
};
