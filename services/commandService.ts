import { Command } from '@/types';

export const groupAndSortCommands = (commands: Command[]): Command[] => {
    if (!commands.length) return [];

    const grouped: { [key: string]: Command[] } = {};
    commands.forEach(command => {
        if (!grouped[command.group]) {
            grouped[command.group] = [];
        }
        grouped[command.group].push(command);
    });

    const groupOrder = ['Navigation', 'Strains', 'Plants', 'General'];
    const sortedGroups = Object.keys(grouped).sort((a, b) => {
        const indexA = groupOrder.indexOf(a);
        const indexB = groupOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    const result: Command[] = [];
    sortedGroups.forEach(group => {
        result.push({ id: `header-${group}`, title: group, group, isHeader: true, action: () => {}, icon: () => null });
        result.push(...grouped[group].sort((a, b) => a.title.localeCompare(b.title)));
    });

    return result;
};
