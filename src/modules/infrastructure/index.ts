import {
    provisionSiteInternal
} from "./controllers/provisioning.controller";
import {
    exportBackupData,
    type BackupData
} from "./services/backup-export.service";
import { importBackupData } from "./services/backup-import.service";
export { DokployService } from "./services/dokploy.service";
export type { BackupData };

export const InfrastructureClient = {
    provisionSite: provisionSiteInternal,
    exportBackupData,
    importBackupData
};
