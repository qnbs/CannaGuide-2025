import React from 'react';
import { Card } from '../../../common/Card';
import { Button } from '../../../common/Button';
import { Task } from '../../../../types';
import { useTranslations } from '../../../../hooks/useTranslations';

interface TasksTabProps {
    tasks: Task[];
    onCompleteTask: (taskId: string) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({ tasks, onCompleteTask }) => {
    const { t } = useTranslations();

    return (
        <Card>
            <ul className="space-y-3">
                {tasks.length > 0 ? (
                    [...tasks].sort((a,b) => (a.isCompleted ? 1 : -1) - (b.isCompleted ? 1 : -1) || a.createdAt - b.createdAt).map(task => (
                       <li key={task.id} className={`flex items-center gap-4 p-3 rounded-lg ${task.isCompleted ? 'bg-slate-800 opacity-60' : 'bg-slate-800'}`}>
                           <div className="flex-grow">
                               <p className={`font-semibold ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-100'}`}>{task.title}</p>
                               <p className="text-sm text-slate-300">{task.description}</p>
                           </div>
                           {!task.isCompleted && (
                               <Button size="sm" onClick={() => onCompleteTask(task.id)}>{t('plantsView.detailedView.tasksComplete')}</Button>
                           )}
                       </li>
                    ))
                ) : (
                    <p className="text-center text-slate-400 py-8">{t('plantsView.detailedView.tasksNoEntries')}</p>
                )}
            </ul>
        </Card>
    );
};
