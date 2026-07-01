import { Strain, SavedStrainTip, SavedSetup, Plant } from '@/types'
import { TFunction } from 'i18next'
import { exportPlantReportPdf } from './export/plantReportExport'
import { exportSetupsAsPdf, exportSetupsAsTxt } from './export/setupExport'
import {
    exportStrainsAsPdf,
    exportStrainsAsTxt,
    exportStrainTips,
} from './export/strainExport'

class ExportService {
    public exportStrainsAsPdf(strains: Strain[], fileName: string, t: TFunction) {
        exportStrainsAsPdf(strains, fileName, t)
    }

    public exportStrainsAsTxt(strains: Strain[], fileName: string, t: TFunction) {
        exportStrainsAsTxt(strains, fileName, t)
    }

    public exportStrainTips(
        tips: SavedStrainTip[],
        format: 'pdf' | 'txt',
        fileName: string,
        t: TFunction,
    ) {
        exportStrainTips(tips, format, fileName, t)
    }

    public exportSetupsAsPdf(setups: SavedSetup[], fileName: string, t: TFunction) {
        exportSetupsAsPdf(setups, fileName, t)
    }

    public exportSetupsAsTxt(setups: SavedSetup[], fileName: string, t: TFunction) {
        exportSetupsAsTxt(setups, fileName, t)
    }

    public exportPlantReportPdf(params: {
        plant: Plant
        t: TFunction
        chartElement?: HTMLElement | null
        photos?: string[]
        fileName?: string
    }) {
        return exportPlantReportPdf(params)
    }
}

export const exportService = new ExportService()
