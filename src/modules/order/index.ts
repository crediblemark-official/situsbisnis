import { countOrdersInternal } from "./actions";

// Facade / Client kontrak publik
export const OrderClient = {
    countOrders: countOrdersInternal
};
