import React from 'react';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) {
        return null;
    }

    const pageNumbers: (string | number)[] = [];
    const maxPagesToShow = 5;
    
    // Logic to determine which page numbers to show
    if (totalPages <= maxPagesToShow + 2) {
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(i);
        }
    } else {
        if (currentPage <= maxPagesToShow - 2) {
            for (let i = 1; i <= maxPagesToShow -1; i++) {
                pageNumbers.push(i);
            }
            pageNumbers.push('...');
            pageNumbers.push(totalPages);
        } else if (currentPage > totalPages - (maxPagesToShow - 2)) {
            pageNumbers.push(1);
            pageNumbers.push('...');
            for (let i = totalPages - (maxPagesToShow - 2); i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            pageNumbers.push(1);
            pageNumbers.push('...');
            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                pageNumbers.push(i);
            }
            pageNumbers.push('...');
            pageNumbers.push(totalPages);
        }
    }

    return (
        <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                aria-label="Previous Page"
            >
                <PhosphorIcons.ArrowLeft className="w-4 h-4" />
            </button>
            {pageNumbers.map((num, index) =>
                typeof num === 'string' ? (
                    <span key={`ellipsis-${index}`} className="px-2 py-1 text-slate-400">...</span>
                ) : (
                    <button
                        key={num}
                        onClick={() => onPageChange(num)}
                        className={`w-8 h-8 rounded-md text-sm font-semibold transition-colors ${
                            currentPage === num
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                        }`}
                        aria-current={currentPage === num ? 'page' : undefined}
                    >
                        {num}
                    </button>
                )
            )}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                aria-label="Next Page"
            >
                <PhosphorIcons.ArrowRight className="w-4 h-4" />
            </button>
        </nav>
    );
};