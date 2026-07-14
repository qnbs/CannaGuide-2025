import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { scoreBgColor } from './analyticsFormatters'

const MAX_SCORE = 100

/** Radial garden-score gauge. Split out of AnalyticsDashboardView for the file budget. */
export const ScoreGauge: React.FC<{ score: number }> = memo(({ score }) => {
    const { t } = useTranslation()
    const radius = 54
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / MAX_SCORE) * circumference

    return (
        <svg
            width="130"
            height="130"
            viewBox="0 0 130 130"
            className="mx-auto"
            role="img"
            aria-label={t('common.accessibility.gardenScoreGauge', {
                score,
                max: MAX_SCORE,
            })}
        >
            <circle
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="10"
            />
            <circle
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                className={scoreBgColor(score)}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 65 65)"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
            <text
                x="65"
                y="60"
                textAnchor="middle"
                className="fill-white text-2xl font-bold"
                fontSize="28"
            >
                {score}
            </text>
            <text
                x="65"
                y="80"
                textAnchor="middle"
                className="fill-white/40"
                fontSize="12"
                aria-hidden="true"
            >
                {t('common.accessibility.scoreOutOf', { max: MAX_SCORE })}
            </text>
        </svg>
    )
})
ScoreGauge.displayName = 'ScoreGauge'
