import { eventBus } from "@/modules/shared/core/event-bus";

export async function initDomainListeners() {
  eventBus.reply<{ siteId: string; domain: string }, any>(
    "request.tenant.registerDomain",
    async (data) => {
      const { registerDomain } = await import("../services/domain.service");
      return registerDomain(data.siteId, data.domain);
    }
  );

  eventBus.reply<{ siteId: string; domain: string }, any>(
    "request.tenant.removeDomain",
    async (data) => {
      const { removeDomain } = await import("../services/domain.service");
      return removeDomain(data.siteId, data.domain);
    }
  );

  eventBus.reply<{ siteId: string; domain: string }, any>(
    "request.tenant.verifyDomain",
    async (data) => {
      const { verifyDomain } = await import("../services/domain.service");
      return verifyDomain(data.siteId, data.domain);
    }
  );
}
