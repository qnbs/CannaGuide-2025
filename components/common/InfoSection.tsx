import React from 'react'
import { Card } from './Card'

interface InfoSectionProps {
    title: string
    children: React.ReactNode
    className?: string
    icon?: React.ReactNode
}

export const InfoSection: React.FC<InfoSectionProps> = ({ title, children, className, icon }) => {
    return (
        <Card className={className}>
            <h2 className="text-xl font-semibold text-primary-400 mb-3 flex items-center gap-2">
                {icon}
                {title}
            </h2>
            {children}
        </Card>
    )
}
