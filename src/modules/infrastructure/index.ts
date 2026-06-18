import {
    provisionSite
} from "./services/provisioning.service";
import {
    exportBackupData,
    type BackupData
} from "./services/backup-export.service";
import { importBackupData } from "./services/backup-import.service";
import { manageSiteAction } from "./services/site-management.service";
export { DokployService } from "./services/dokploy.service";
export type { BackupData };

export const InfrastructureClient = {
    provisionSite,
    exportBackupData,
    importBackupData,
    manageSite: manageSiteAction
};




