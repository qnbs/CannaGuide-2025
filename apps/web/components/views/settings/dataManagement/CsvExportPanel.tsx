import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/stores/store'
import { selectActiveGrowPlants } from '@/stores/selectors'
import { selectAllPlannerTasks } from '@/stores/slices/growPlannerSlice'
import { Card } from '@/components/common/Card'
import { FormSection } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { csvExportService } from '@/services/csvExportService'

export const CsvExportPanel: React.FC = () => {
    const { t } = useTranslation()
    const activeGrowPlants = useAppSelector(selectActiveGrowPlants)
    const plannerTasks = useAppSelector(selectAllPlannerTasks)

    const dateSuffix = new Date().toISOString().slice(0, 10)

    return (
        <Card>
            <FormSection
                title={t('settingsView.csvExport.title')}
                icon={<PhosphorIcons.FileText />}
                defaultOpen
            >
                <div className="sm:col-span-2 space-y-4">
                    <p className="text-xs text-slate-400">
                        {t('settingsView.csvExport.description')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                            onClick={() => {
                                const plants = activeGrowPlants.map((p) => ({
                                    id: p.id,
                                    name: p.name,
                                    strain: p.strain.name,
                                    stage: p.stage,
                                    startDate: p.createdAt,
                                    notes: '',
                                    growId: p.growId,
                                }))
                                const csv = csvExportService.exportPlants(plants)
                                csvExportService.downloadCsv(
                                    csv,
                                    `cannaguide-plants-${dateSuffix}.csv`,
                                )
                            }}
                            variant="secondary"
                            className="flex-1 justify-center"
                        >
                            <PhosphorIcons.DownloadSimple className="mr-2" />
                            {t('settingsView.csvExport.exportPlants')}
                        </Button>
                        <Button
                            onClick={() => {
                                const tasks = plannerTasks.map((task) => ({
                                    id: task.id,
                                    plantId: task.plantId,
                                    type: task.type,
                                    scheduledAt: task.scheduledAt,
                                    completedAt: task.completedAt,
                                    recurring: task.recurring,
                                    notes: task.notes,
                                }))
                                const csv = csvExportService.exportTasks(tasks)
                                csvExportService.downloadCsv(
                                    csv,
                                    `cannaguide-tasks-${dateSuffix}.csv`,
                                )
                            }}
                            variant="secondary"
                            className="flex-1 justify-center"
                        >
                            <PhosphorIcons.DownloadSimple className="mr-2" />
                            {t('settingsView.csvExport.exportTasks')}
                        </Button>
                    </div>
                </div>
            </FormSection>
        </Card>
    )
}
