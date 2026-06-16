import * as settingsService from "../services/settings.service";

/**
 * Server Actions / Wrapper internal untuk mengambil pengaturan situs.
 */
export async function getSiteSettingsInternal(siteId?: string) {
    return settingsService.getSiteSettings(siteId);
}

/**
 * Server Actions / Wrapper internal untuk memperbarui pengaturan situs.
 */
export async function updateSiteSettingsInternal(data: any, siteId: string) {
    return settingsService.updateSiteSettings(data, siteId);
}
