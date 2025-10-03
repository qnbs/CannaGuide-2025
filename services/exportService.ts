// services/exportService.ts
import { Strain, SavedSetup, ExportFormat, ArchivedMentorResponse, SavedStrainTip, ArchivedAdvisorResponse } from '@/types';
import { getT } from '@/i18n';
import {
    exportStrainsLogic,
    exportSetupLogic,
    exportSetupsLogic,
    exportStrainTipsLogic,
    exportMentorArchiveLogic,
    exportAdvisorArchiveLogic,
} from './exportLogic';

const exportStrains = (strains: Strain[], format: ExportFormat, filename: string) => {
    const t = getT();
    exportStrainsLogic(strains, format, filename, t);
};

const exportSetup = (setup: SavedSetup, format: ExportFormat) => {
    const t = getT();
    exportSetupLogic(setup, format, t);
};

const exportSetups = (setups: SavedSetup[], format: ExportFormat, filename: string) => {
    const t = getT();
    exportSetupsLogic(setups, format, filename, t);
};

const exportStrainTips = (tips: SavedStrainTip[], format: ExportFormat, filename: string) => {
    const t = getT();
    exportStrainTipsLogic(tips, format, filename, t);
};

const exportMentorArchive = (responses: ArchivedMentorResponse[], format: ExportFormat, filename: string) => {
    const t = getT();
    exportMentorArchiveLogic(responses, format, filename, t);
};

const exportAdvisorArchive = (responses: (ArchivedAdvisorResponse & {plantName: string})[], format: ExportFormat, filename: string) => {
    const t = getT();
    exportAdvisorArchiveLogic(responses, format, filename, t);
};

export const exportService = {
    exportStrains,
    exportSetup,
    exportSetups,
    exportStrainTips,
    exportMentorArchive,
    exportAdvisorArchive
};