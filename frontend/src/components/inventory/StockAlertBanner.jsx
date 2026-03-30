import { useState, useEffect } from 'react';

const StockAlertBanner = ({ type, count, onFilterClick, onDismiss }) => {
    const [isDismissed, setIsDismissed] = useState(false);
    const storageKey = `inventory_alert_${type}_dismissed`;

    useEffect(() => {
        // Check sessionStorage on mount
        const dismissed = sessionStorage.getItem(storageKey) === 'true';
        setIsDismissed(dismissed);
    }, [storageKey]);

    const handleDismiss = () => {
        sessionStorage.setItem(storageKey, 'true');
        setIsDismissed(true);
        if (onDismiss) onDismiss();
    };

    if (isDismissed || count === 0) return null;

    const config = {
        out_of_stock: {
            color: 'red',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            textColor: 'text-red-800',
            iconColor: 'text-red-500',
            title: 'Out of Stock',
            message: `${count} item${count > 1 ? 's are' : ' is'} out of stock`
        },
        low_stock: {
            color: 'yellow',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200',
            textColor: 'text-yellow-800',
            iconColor: 'text-yellow-500',
            title: 'Low Stock Alert',
            message: `${count} item${count > 1 ? 's are' : ' is'} running low`
        }
    };

    const styles = config[type];

    return (
        <div className={`${styles.bgColor} border ${styles.borderColor} rounded-lg p-4 mb-4`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <svg className={`w-6 h-6 ${styles.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <h3 className={`font-semibold ${styles.textColor}`}>{styles.title}</h3>
                        <p className={`text-sm ${styles.textColor} opacity-90`}>{styles.message}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onFilterClick}
                        className={`px-3 py-1 text-sm font-medium ${styles.textColor} hover:opacity-80 transition-opacity`}
                    >
                        View {type === 'out_of_stock' ? 'out of stock' : 'low stock'} items
                    </button>
                    <button
                        onClick={handleDismiss}
                        className={`p-1 ${styles.textColor} hover:opacity-80 transition-opacity`}
                        title="Dismiss"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockAlertBanner;