import React, { lazy, Suspense, useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectSandboxState, selectActivePlants } from '@/stores/selectors'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Modal } from '@/components/common/Modal'
import {
    runComparisonScenario,
    clearCurrentExperiment,
    saveExperiment,
    deleteExperiment,
    loadSavedExperiment,
} from '@/stores/slices/sandboxSlice'
import { scenarioService } from '@/services/scenarioService'
import { Card } from '@/components/common/Card'
import { SavedExperiment, ScenarioAction, Scenario } from '@/types'

const ComparisonView = lazy(() =>
    import('../plants/ComparisonView').then((m) => ({ default: m.ComparisonView })),
)

// -- Action options for custom experiment builder --------------------------

const ACTION_OPTIONS: ScenarioAction[] = [
    'NONE',
    'TOP',
    'LST',
    'TEMP_PLUS_2',
    'TEMP_MINUS_2',
    'HUMIDITY_PLUS_10',
    'HUMIDITY_MINUS_10',
    'LIGHT_BOOST',
    'PH_DRIFT_ACIDIC',
    'EC_RAMP',
    'DEFOLIATE',
]

const ACTION_SET: ReadonlySet<string> = new Set(ACTION_OPTIONS)

function isScenarioAction(value: string): value is ScenarioAction {
    return ACTION_SET.has(value)
}

// -- SavedExperimentCard ---------------------------------------------------

const SavedExperimentCard: React.FC<{
    experiment: SavedExperiment
    onDelete: () => void
    onView: () => void
}> = ({ experiment, onDelete, onView }) => {
    const { t } = useTranslation()
    const scenario = scenarioService.getScenarioById(experiment.scenarioId)
    const scenarioTitle = scenario
        ? scenario.title || t(scenario.titleKey, { defaultValue: scenario.titleKey })
        : experiment.scenarioId
    return (
        <Card className="!p-3 bg-slate-800">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-slate-100">{scenarioTitle}</h4>
                    <p className="text-xs text-slate-400">
                        {t('knowledgeView.sandbox.basedOn', { name: experiment.basePlantName })}
                    </p>
                    <p className="text-xs text-slate-500">
                        {t('knowledgeView.sandbox.run', {
                            date: new Date(experiment.createdAt).toLocaleDateString(),
                        })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="icon"
                        variant="secondary"
                        onClick={onView}
                        aria-label={t('knowledgeView.sandbox.viewResults', 'View')}
                    >
                        <PhosphorIcons.ArrowSquareOut />
                    </Button>
                    <Button
                        size="icon"
                        variant="danger"
                        onClick={onDelete}
                        aria-label={t('common.delete')}
                    >
                        <PhosphorIcons.TrashSimple />
                    </Button>
                </div>
            </div>
        </Card>
    )
}

// -- Custom Experiment Builder ---------------------------------------------

const CustomExperimentBuilder: React.FC<{
    onRun: (scenario: Scenario) => void
}> = ({ onRun }) => {
    const { t } = useTranslation()
    const [duration, setDuration] = useState(14)
    const [actionA, setActionA] = useState<ScenarioAction>('NONE')
    const [dayA, setDayA] = useState(1)
    const [actionB, setActionB] = useState<ScenarioAction>('TOP')
    const [dayB, setDayB] = useState(3)

    const handleRun = useCallback(() => {
        const scenario: Scenario = {
            id: `custom-${Date.now()}`,
            titleKey: 'knowledgeView.sandbox.customExperiment',
            descriptionKey: 'knowledgeView.sandbox.customExperiment',
            durationDays: duration,
            plantAModifier: { day: dayA, action: actionA },
            plantBModifier: { day: dayB, action: actionB },
        }
        onRun(scenario)
    }, [duration, actionA, dayA, actionB, dayB, onRun])

    return (
        <Card className="bg-slate-800/60 border-dashed border-primary-500/30">
            <h4 className="font-bold text-sm text-primary-300 mb-3">
                {t('knowledgeView.sandbox.customExperiment', 'Custom Experiment')}
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2">
                    <label className="text-xs text-slate-400">
                        {t('knowledgeView.sandbox.customDuration', 'Duration (days)')}
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={90}
                        value={duration}
                        onChange={(e) =>
                            setDuration(Math.max(1, Math.min(90, Number(e.target.value))))
                        }
                        className="w-full mt-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-white"
                    />
                </div>

                {/* Plant A */}
                <div>
                    <label className="text-xs text-slate-400">
                        {t('knowledgeView.sandbox.customActionA', 'Plant A Action')}
                    </label>
                    <select
                        value={actionA}
                        onChange={(e) => {
                            if (isScenarioAction(e.target.value)) setActionA(e.target.value)
                        }}
                        className="w-full mt-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-white"
                    >
                        {ACTION_OPTIONS.map((a) => (
                            <option key={a} value={a}>
                                {t(`knowledgeView.sandbox.actionLabels.${a}`, a)}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-400">
                        {t('knowledgeView.sandbox.customDayA', 'Apply on Day')}
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={duration}
                        value={dayA}
                        onChange={(e) =>
                            setDayA(Math.max(1, Math.min(duration, Number(e.target.value))))
                        }
                        className="w-full mt-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-white"
                    />
                </div>

                {/* Plant B */}
                <div>
                    <label className="text-xs text-slate-400">
                        {t('knowledgeView.sandbox.customActionB', 'Plant B Action')}
                    </label>
                    <select
                        value={actionB}
                        onChange={(e) => {
                            if (isScenarioAction(e.target.value)) setActionB(e.target.value)
                        }}
                        className="w-full mt-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-white"
                    >
                        {ACTION_OPTIONS.map((a) => (
                            <option key={a} value={a}>
                                {t(`knowledgeView.sandbox.actionLabels.${a}`, a)}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-400">
                        {t('knowledgeView.sandbox.customDayB', 'Apply on Day')}
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={duration}
                        value={dayB}
                        onChange={(e) =>
                            setDayB(Math.max(1, Math.min(duration, Number(e.target.value))))
                        }
                        className="w-full mt-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-white"
                    />
                </div>

                <div className="col-span-2">
                    <Button onClick={handleRun} className="w-full mt-2">
                        <PhosphorIcons.Play className="w-4 h-4 mr-2" />
                        {t('knowledgeView.sandbox.modal.runScenario', 'Run Scenario')}
                    </Button>
                </div>
            </div>
        </Card>
    )
}

// -- SandboxView -----------------------------------------------------------

const SandboxView: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const { currentExperiment, status, savedExperiments } = useAppSelector(selectSandboxState)
    const activePlants = useAppSelector(selectActivePlants)
    const availableScenarios = useMemo(() => scenarioService.getAllScenarios(), [])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [showCustom, setShowCustom] = useState(false)
    const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)
    const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
        () => availableScenarios[0]?.id || 'topping-vs-lst',
    )

    React.useEffect(() => {
        if (
            activePlants.length > 0 &&
            (!selectedPlantId || !activePlants.some((p) => p.id === selectedPlantId))
        ) {
            setSelectedPlantId(activePlants[0]?.id ?? null)
        } else if (activePlants.length === 0) {
            setSelectedPlantId(null)
        }
    }, [activePlants, selectedPlantId])

    const handleRunScenario = useCallback(() => {
        if (selectedPlantId) {
            const scenario = scenarioService.getScenarioById(selectedScenarioId)
            if (scenario) {
                dispatch(runComparisonScenario({ plantId: selectedPlantId, scenario }))
                setIsModalOpen(false)
            }
        }
    }, [selectedPlantId, selectedScenarioId, dispatch])

    const handleRunCustom = useCallback(
        (scenario: Scenario) => {
            if (selectedPlantId) {
                dispatch(runComparisonScenario({ plantId: selectedPlantId, scenario }))
                setShowCustom(false)
            }
        },
        [selectedPlantId, dispatch],
    )

    const handleSave = useCallback(() => {
        if (currentExperiment) {
            const basePlant = activePlants.find((p) => p.id === currentExperiment.basePlantId)
            const scenario = currentExperiment.scenarioId
                ? scenarioService.getScenarioById(currentExperiment.scenarioId)
                : null
            if (basePlant && scenario) {
                dispatch(saveExperiment({ scenario, basePlantName: basePlant.name }))
            }
        }
    }, [currentExperiment, activePlants, dispatch])

    const handleViewSaved = useCallback(
        (id: string) => {
            dispatch(loadSavedExperiment(id))
        },
        [dispatch],
    )

    if (status === 'succeeded' && currentExperiment) {
        return (
            <div>
                <Suspense
                    fallback={<div className="h-64 animate-pulse bg-slate-700/30 rounded-lg" />}
                >
                    <ComparisonView
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                        experiment={currentExperiment as SavedExperiment}
                        onFinish={() => dispatch(clearCurrentExperiment())}
                    />
                </Suspense>
                <div className="mt-4 text-center">
                    <Button onClick={handleSave}>
                        <PhosphorIcons.ArchiveBox className="w-5 h-5 mr-2" />
                        Save Experiment Results
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div>
            {isModalOpen && (
                <Modal
                    isOpen={true}
                    onClose={() => setIsModalOpen(false)}
                    title={t('knowledgeView.sandbox.modal.title')}
                >
                    {activePlants.length > 0 ? (
                        <div className="space-y-4">
                            <p>{t('knowledgeView.sandbox.modal.description')}</p>
                            <select
                                value={selectedPlantId ?? ''}
                                onChange={(e) => setSelectedPlantId(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-md p-2"
                            >
                                {activePlants.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedScenarioId}
                                onChange={(e) => setSelectedScenarioId(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-md p-2"
                            >
                                {availableScenarios.map((scenario) => {
                                    const title =
                                        scenario.title ||
                                        t(scenario.titleKey, { defaultValue: scenario.titleKey })
                                    return (
                                        <option key={scenario.id} value={scenario.id}>
                                            {title}
                                        </option>
                                    )
                                })}
                            </select>
                            <Button onClick={handleRunScenario} className="w-full">
                                {t('knowledgeView.sandbox.modal.runScenario')}
                            </Button>
                        </div>
                    ) : (
                        <p>{t('knowledgeView.sandbox.modal.noPlants')}</p>
                    )}
                </Modal>
            )}

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold font-display text-primary-400">
                    {t('knowledgeView.sandbox.title')}
                </h3>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => setShowCustom(!showCustom)}
                        disabled={activePlants.length === 0}
                    >
                        <PhosphorIcons.Wrench className="w-5 h-5 mr-2" />
                        {t('knowledgeView.sandbox.customExperiment', 'Custom')}
                    </Button>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        disabled={activePlants.length === 0}
                    >
                        <PhosphorIcons.Flask className="w-5 h-5 mr-2" />
                        {t('knowledgeView.sandbox.startExperiment')}
                    </Button>
                </div>
            </div>

            {/* -- Plant selector for custom builder -- */}
            {showCustom && activePlants.length > 0 && (
                <div className="mb-4 space-y-3">
                    <select
                        value={selectedPlantId ?? ''}
                        onChange={(e) => setSelectedPlantId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm"
                    >
                        {activePlants.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                    <CustomExperimentBuilder onRun={handleRunCustom} />
                </div>
            )}

            <h4 className="font-bold text-lg text-slate-200 mb-2">
                {t('knowledgeView.sandbox.savedExperiments')}
            </h4>
            {savedExperiments.length > 0 ? (
                <div className="space-y-2">
                    {savedExperiments.map((exp) => (
                        <SavedExperimentCard
                            key={exp.id}
                            experiment={exp}
                            onDelete={() => dispatch(deleteExperiment(exp.id))}
                            onView={() => handleViewSaved(exp.id)}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-sm text-slate-500">{t('knowledgeView.sandbox.noExperiments')}</p>
            )}
        </div>
    )
}

export default SandboxView
