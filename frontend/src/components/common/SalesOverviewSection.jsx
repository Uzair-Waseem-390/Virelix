import { formatCurrency } from '../../utils/form';

const SalesOverviewSection = ({ totalConfirmed, totalDraft, totalRevenue, onViewConfirmed, onViewDraft }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-green-700">Confirmed Sales</span>
                        </div>
                        <p className="text-3xl font-bold text-green-900">{totalConfirmed}</p>
                        <p className="text-sm text-green-700 mt-2">Total Revenue: {formatCurrency(totalRevenue)}</p>
                    </div>
                    <button
                        onClick={onViewConfirmed}
                        className="text-green-700 hover:text-green-800 text-sm font-medium"
                    >
                        View all confirmed →
                    </button>
                </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-amber-700">Draft Sales</span>
                        </div>
                        <p className="text-3xl font-bold text-amber-900">{totalDraft}</p>
                        <p className="text-sm text-amber-700 mt-2">Pending confirmation</p>
                    </div>
                    <button
                        onClick={onViewDraft}
                        className="text-amber-700 hover:text-amber-800 text-sm font-medium"
                    >
                        View drafts →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalesOverviewSection;