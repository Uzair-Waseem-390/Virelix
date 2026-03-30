const AlertBanner = ({ type, items, onItemClick, projectContext = false }) => {
    const config = {
        out_of_stock: {
            title: 'Out of Stock',
            icon: '🔴',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            textColor: 'text-red-800'
        },
        low_stock: {
            title: 'Low Stock',
            icon: '🟡',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            textColor: 'text-orange-800'
        }
    };

    const style = config[type];

    if (!items || items.length === 0) {
        return (
            <div className={`rounded-lg border ${type === 'out_of_stock' ? 'border-green-200 bg-green-50' : 'border-green-200 bg-green-50'} p-6 text-center`}>
                <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl">✅</span>
                    <p className="text-green-700">All stock levels are healthy</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`rounded-lg border ${style.borderColor} ${style.bgColor} overflow-hidden`}>
            <div className="px-4 py-3 border-b border-gray-200 bg-white bg-opacity-50">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{style.icon}</span>
                    <h3 className={`font-semibold ${style.textColor}`}>
                        {style.title} ({items.length} {items.length === 1 ? 'item' : 'items'})
                    </h3>
                </div>
            </div>
            <div className="divide-y divide-gray-200">
                {items.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => onItemClick(item)}
                        className="w-full px-4 py-3 text-left hover:bg-white hover:bg-opacity-50 transition-colors flex items-center justify-between group"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{item.product_name}</span>
                                {!projectContext && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full text-gray-600">
                                        {item.project_name}
                                    </span>
                                )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                                {item.quantity} / {item.low_stock_threshold} units
                            </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AlertBanner;