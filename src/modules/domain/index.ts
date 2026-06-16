import {
    registerDomainInternal,
    verifyDomainInternal,
    removeDomainInternal
} from "./controllers/domain.controller";

export const DomainClient = {
    registerDomain: registerDomainInternal,
    verifyDomain: verifyDomainInternal,
    removeDomain: removeDomainInternal
};
