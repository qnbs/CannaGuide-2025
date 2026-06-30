import React from 'react'
import { useTranslation } from 'react-i18next'
import type { GenealogyNode } from '@/types'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { GENEALOGY_NODE_SIZE } from '@/constants'

export interface GenealogyLayoutNode {
    data: GenealogyNode
    depth: number
    x: number
    y: number
}

export interface GenealogyLayoutLink {
    sourceIndex: number
    targetIndex: number
}

// ---------------------------------------------------------------------------
// Error fallback – shown when a local error occurred.
// ---------------------------------------------------------------------------
export const GenealogyError: React.FC<{ message: string; onReset: () => void }> = ({
    message,
    onReset,
}) => {
    const { t } = useTranslation()
    return (
        <Card className="text-center py-10">
            <PhosphorIcons.WarningCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <p className="text-red-300 font-semibold">{message}</p>
            <p className="text-slate-400 text-sm mt-2">
                {t('strainsView.genealogyView.pleaseReloadOrContact')}
            </p>
            <Button variant="danger" size="sm" className="mt-4" onClick={onReset}>
                <PhosphorIcons.ArrowClockwise className="mr-1" /> {t('common.resetState')}
            </Button>
        </Card>
    )
}

// ---------------------------------------------------------------------------
// GenealogyLink – smooth cubic-bézier curves between node edges.
// ---------------------------------------------------------------------------
const HALF_W = GENEALOGY_NODE_SIZE.width / 2
const HALF_H = GENEALOGY_NODE_SIZE.height / 2

export const GenealogyLink = React.memo<{
    source: GenealogyLayoutNode
    target: GenealogyLayoutNode
    orientation: 'horizontal' | 'vertical'
}>(({ source, target, orientation }) => {
    let pathData = ''
    try {
        if (
            source?.x == null ||
            source?.y == null ||
            target?.x == null ||
            target?.y == null ||
            !Number.isFinite(source.x) ||
            !Number.isFinite(source.y) ||
            !Number.isFinite(target.x) ||
            !Number.isFinite(target.y)
        ) {
            return null
        }
        if (orientation === 'horizontal') {
            const sx = source.y + HALF_W
            const sy = source.x
            const tx = target.y - HALF_W
            const ty = target.x
            const mx = (sx + tx) / 2
            pathData = `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`
        } else {
            const sx = source.x
            const sy = source.y + HALF_H
            const tx = target.x
            const ty = target.y - HALF_H
            const my = (sy + ty) / 2
            pathData = `M${sx},${sy} C${sx},${my} ${tx},${my} ${tx},${ty}`
        }
    } catch {
        return null
    }
    if (!pathData) return null
    return <path className="genealogy-link" d={pathData} />
})
GenealogyLink.displayName = 'GenealogyLink'
