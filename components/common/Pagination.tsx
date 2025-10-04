import React from 'react';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    const { t } = useTranslation();

    const getPageNumbers = () => {
        const pageNumbers: (number | string)[] = [];
        const maxPagesToShow = 5;
        const halfPages = Math.floor(maxPagesToShow / 2);

        if (totalPages <= maxPagesToShow + 2) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            pageNumbers.push(1);
            if (currentPage > halfPages + 2) {
                pageNumbers.push('...');
            }

            let start = Math.max(2, currentPage - halfPages);
            let end = Math.min(totalPages - 1, currentPage + halfPages);
            
            if (currentPage <= halfPages + 1) {
                end = maxPagesToShow;
            }
            if (currentPage >= totalPages - halfPages) {
                start = totalPages - maxPagesToShow + 1;
            }

            for (let i = start; i <= end; i++) {
                pageNumbers.push(i);
            }

            if (currentPage < totalPages - halfPages - 1) {
                pageNumbers.push('...');
            }
            pageNumbers.push(totalPages);
        }
        return pageNumbers;
    };

    const pages = getPageNumbers();

    if (totalPages <= 1) {
        return null;
    }

    return (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-2 mt-6">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={t('common.back')}
            >
                <PhosphorIcons.ArrowLeft className="w-5 h-5" />
            </button>
            
            {pages.map((page, index) => (
                <React.Fragment key={index}>
                    {typeof page === 'number' ? (
                        <button
                            onClick={() => onPageChange(page)}
                            className={`w-9 h-9 rounded-md text-sm font-semibold transition-colors ${
                                currentPage === page
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-slate-800 hover:bg-slate-700'
                            }`}
                            aria-current={currentPage === page ? 'page' : undefined}
                        >
                            {page}
                        </button>
                    ) : (
                        <span className="w-9 h-9 flex items-center justify-center text-slate-400">...</span>
                    )}
                </React.Fragment>
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={t('common.next')}
            >
                <PhosphorIcons.ArrowRight className="w-5 h-5" />
            </button>
        </nav>
    );
};
