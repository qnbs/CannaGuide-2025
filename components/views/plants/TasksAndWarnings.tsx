
import React, { memo } from 'react';
import { Card } from '@/components/common/Card';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
import { Task, PlantProblem, TaskPriority } from '@/types';

interface TasksAndWarningsProps {
    tasks: (Task & { plantId: string, plantName: string })[],
    problems: (PlantProblem & { plantId: string, plantName: string })[],
}

export const TasksAndWarnings: React.FC<TasksAndWarningsProps> = memo(({ tasks, problems }) => {
    const { t } = useTranslation();
    const priorityClasses: Record<TaskPriority, string> = { high: 'border-red-500/50 bg-red-500/10', medium: 'border-amber-500/50 bg-amber-500/10', low: 'border-blue-500/50 bg-blue-500/10', };
    const priorityIcons: Record<TaskPriority, { icon: React.ReactNode; color: string }> = { high: { icon: <PhosphorIcons.Lightning />, color: 'text-red-500' }, medium: { icon: <PhosphorIcons.ArrowUp />, color: 'text-amber-500' }, low: { icon: <PhosphorIcons.ArrowDown />, color: 'text-blue-500' }, };
    const priorityLabels: Record<TaskPriority, string> = { high: t('plantsView.tasks.priorities.high'), medium: t('plantsView.tasks.priorities.medium'), low: t('plantsView.tasks.priorities.low'), };

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 flex items-center gap-2 mb-4">
                    <PhosphorIcons.Checks className="w-6 h-6" /> {t('plantsView.tasks.title')}
                </h3>
                {tasks.length > 0 ? (
                    <div className="space-y-3">
                        {tasks.map(task => (
                            <div key={`${task.plantId}-${task.id}`} className={`p-2 border-l-4 ${priorityClasses[task.priority]} rounded-r-md flex items-center justify-between`}>
                                <div>
                                    <p className="font-bold text-sm text-slate-100">{t(task.title)}</p>
                                    <p className="text-xs text-slate-300">{task.plantName}</p>
                                </div>
                                <div className={`w-5 h-5 flex-shrink-0 ${priorityIcons[task.priority].color}`} title={`${t('plantsView.tasks.priority')}: ${priorityLabels[task.priority]}`}>
                                    {priorityIcons[task.priority].icon}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-300 text-sm">{t('plantsView.tasks.none')}</p>
                )}
            </Card>
             <Card>
                <h3 className="text-xl font-bold font-display mb-4 text-amber-400 flex items-center gap-2">
                    <PhosphorIcons.WarningCircle className="w-6 h-6" /> {t('plantsView.warnings.title')}
                </h3>
                {problems.length > 0 ? (
                    <div className="space-y-3">
                        {problems.map((problem, index) => (
                            <div key={`${problem.plantId}-${index}`} className="p-2 border-l-4 border-amber-500/50 bg-amber-500/10 rounded-r-md">
                                <p className="font-bold text-sm text-slate-100">{t(`problemMessages.${problem.type.charAt(0).toLowerCase() + problem.type.slice(1)}.message`)}</p>
                                <p className="text-xs text-slate-300">{problem.plantName}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-300 text-sm">{t('plantsView.warnings.none')}</p>
                )}
            </Card>
        </div>
    );
});
