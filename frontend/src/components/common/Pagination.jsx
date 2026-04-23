import { useState } from 'react';

/**
 * Pagination component matching StandardResultsSetPagination response shape:
 * { count, page_number, page_size, total_pages, results }
 * Query param: page_number
 */
const Pagination = ({ pagination, onPageChange }) => {
    const [jumpValue, setJumpValue] = useState('');

    if (!pagination || pagination.total_pages <= 1) return null;

    const { page_number: current, total_pages: total, count, page_size } = pagination;

    const handleJump = (e) => {
        e.preventDefault();
        const page = parseInt(jumpValue, 10);
        if (!isNaN(page) && page >= 1 && page <= total && page !== current) {
            onPageChange(page);
            setJumpValue('');
        }
    };

    // Build visible page numbers: always show first, last, current ±2, with ellipsis
    const getPages = () => {
        const pages = [];
        const delta = 2;
        const left  = Math.max(2, current - delta);
        const right = Math.min(total - 1, current + delta);

        pages.push(1);
        if (left > 2) pages.push('...');
        for (let i = left; i <= right; i++) pages.push(i);
        if (right < total - 1) pages.push('...');
        if (total > 1) pages.push(total);

        return pages;
    };

    const from = Math.min((current - 1) * page_size + 1, count);
    const to   = Math.min(current * page_size, count);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-1">
            {/* Record count */}
            <p className="text-sm text-gray-500 flex-shrink-0">
                Showing <span className="font-medium text-gray-700">{from}–{to}</span> of{' '}
                <span className="font-medium text-gray-700">{count}</span> results
            </p>

            <div className="flex items-center gap-2 flex-wrap justify-center">
                {/* Prev */}
                <button
                    onClick={() => onPageChange(current - 1)}
                    disabled={current === 1}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Previous page"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Page numbers */}
                {getPages().map((page, idx) =>
                    page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 select-none">…</span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => page !== current && onPageChange(page)}
                            className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition-colors ${
                                page === current
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {page}
                        </button>
                    )
                )}

                {/* Next */}
                <button
                    onClick={() => onPageChange(current + 1)}
                    disabled={current === total}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Next page"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {/* Jump to page */}
                {total > 5 && (
                    <form onSubmit={handleJump} className="flex items-center gap-1.5 ml-2">
                        <span className="text-sm text-gray-500 hidden sm:inline">Go to</span>
                        <input
                            type="number"
                            min={1}
                            max={total}
                            value={jumpValue}
                            onChange={e => setJumpValue(e.target.value)}
                            placeholder="pg"
                            className="w-14 h-9 px-2 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            type="submit"
                            className="h-9 px-3 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Go
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Pagination;
