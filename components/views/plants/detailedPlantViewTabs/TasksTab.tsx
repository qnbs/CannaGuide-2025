import React from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Task } from '@/types';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

interface TasksTabProps {
    tasks: Task[];
    onCompleteTask: (taskId: string) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({ tasks, onCompleteTask }) => {
    const { t } = useTranslation();
    
    const openTasks = tasks.filter(t => !t.isCompleted).sort((a, b) => a.createdAt - b.createdAt);
    const completedTasks = tasks.filter(t => t.isCompleted).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

    return (
        <div className="space-y-6">
            <Card>
                 <h3 className="text-lg font-bold font-display text-primary-400 mb-3">{t('plantsView.summary.openTasks')} ({openTasks.length})</h3>
                <ul className="space-y-3">
                    {openTasks.length > 0 ? (
                        openTasks.map(task => (
                           <li key={task.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800">
                               <div className="flex-grow">
                                   <p className="font-semibold text-slate-100">{t(task.title) || task.title}</p>
                                   <p className="text-sm text-slate-300">{t(task.description) || task.description}</p>
                               </div>
                               <Button size="sm" onClick={() => onCompleteTask(task.id)}>{t('plantsView.detailedView.tasksComplete')}</Button>
                           </li>
                        ))
                    ) : (
                        <p className="text-center text-slate-400 py-4">{t('plantsView.tasks.none')}</p>
                    )}
                </ul>
            </Card>
             <Card>
                 <h3 className="text-lg font-bold font-display text-slate-400 mb-3">{t('plantsView.detailedView.tabs.tasks')} ({completedTasks.length})</h3>
                <ul className="space-y-3">
                    {completedTasks.length > 0 ? (
                        completedTasks.map(task => (
                           <li key={task.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800 opacity-60">
                               <PhosphorIcons.CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                               <div className="flex-grow">
                                   <p className="font-semibold line-through text-slate-400">{t(task.title) || task.title}</p>
                                   <p className="text-xs text-slate-500">{t('plantsView.detailedView.tasksCompleted', { date: new Date(task.completedAt!).toLocaleString() })}</p>
                               </div>
                           </li>
                        ))
                    ) : (
                        <p className="text-center text-slate-500 py-4">{t('plantsView.detailedView.tasksNoEntries')}</p>
                    )}
                </ul>
            </Card>
        </div>
    );
};