import React from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
}

const buildPageNumbers = (currentPage: number, totalPages: number): (string | number)[] => {
    const pages: (string | number)[] = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow + 2) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i)
        }
        return pages
    }

    const nearStart = currentPage <= maxPagesToShow - 2
    const nearEnd = currentPage > totalPages - (maxPagesToShow - 2)

    if (nearStart) {
        for (let i = 1; i <= maxPagesToShow - 1; i++) {
            pages.push(i)
        }
        pages.push('...', totalPages)
        return pages
    }

    if (nearEnd) {
        pages.push(1, '...')
        for (let i = totalPages - (maxPagesToShow - 2); i <= totalPages; i++) {
            pages.push(i)
        }
        return pages
    }

    pages.push(1, '...')
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i)
    }
    pages.push('...', totalPages)
    return pages
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
}) => {
    const { t } = useTranslation()
    if (totalPages <= 1) {
        return null
    }

    const pageNumbers = buildPageNumbers(currentPage, totalPages)
    let ellipsisCounter = 0

    return (
        <nav
            className="flex items-center justify-center gap-1"
            aria-label={t('common.pagination.title') || 'Pagination'}
        >
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                aria-label={t('common.pagination.previous')}
            >
                <PhosphorIcons.ArrowLeft className="w-4 h-4" />
            </button>
            {pageNumbers.map((num) =>
                typeof num === 'string' ? (
                    <span
                        key={`ellipsis-${++ellipsisCounter}`}
                        className="px-2 py-1 text-slate-400"
                    >
                        ...
                    </span>
                ) : (
                    <button
                        key={num}
                        onClick={() => onPageChange(num)}
                        className={`min-h-11 min-w-11 inline-flex items-center justify-center rounded-md text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
                            currentPage === num
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                        }`}
                        aria-current={currentPage === num ? 'page' : undefined}
                        aria-label={`${t('common.page')} ${num}`}
                    >
                        {num}
                    </button>
                ),
            )}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                aria-label={t('common.pagination.next')}
            >
                <PhosphorIcons.ArrowRight className="w-4 h-4" />
            </button>
        </nav>
    )
}
