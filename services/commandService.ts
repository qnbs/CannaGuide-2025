
import React from 'react';
import { Command } from '@/types';

export enum CommandGroup {
    Navigation = 'Navigation',
    Plants = 'Plants',
    Strains = 'Strains',
    Knowledge = 'Knowledge',
    Settings = 'Settings',
    General = 'General Actions'
}

const groupOrder: CommandGroup[] = [
    CommandGroup.Navigation,
    CommandGroup.General,
    CommandGroup.Plants,
    CommandGroup.Strains,
    CommandGroup.Knowledge,
    CommandGroup.Settings,
];

export const groupAndSortCommands = (commands: Command[]): Command[] => {
    const grouped = commands.reduce((acc, command) => {
        if (!acc[command.group]) {
            acc[command.group] = [];
        }
        acc[command.group].push(command);
        return acc;
    }, {} as Record<string, Command[]>);

    const result: Command[] = [];
    groupOrder.forEach(groupName => {
        if (grouped[groupName] && grouped[groupName].length > 0) {
            result.push({
                id: `header-${groupName.replace(/\s/g, '')}`,
                title: groupName,
                group: groupName,
                isHeader: true,
                action: () => {},
                icon: React.Fragment,
            });
            result.push(...grouped[groupName]);
        }
    });

    return result;
};