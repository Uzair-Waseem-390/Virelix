import { formatDate } from '../../utils/form';

const MovementTimeline = ({ movements }) => {
    const getMovementIcon = (type) => {
        switch (type) {
            case 'stock_in':
                return (
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                    </div>
                );
            case 'stock_out':
                return (
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                );
            case 'adjustment':
                return (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                );
            default:
                return null;
        }
    };

    const getMovementColor = (type) => {
        switch (type) {
            case 'stock_in': return 'border-l-green-500';
            case 'stock_out': return 'border-l-red-500';
            case 'adjustment': return 'border-l-blue-500';
            default: return 'border-l-gray-500';
        }
    };

    const getQuantityChange = (movement) => {
        const delta = movement.quantity_after - movement.quantity_before;
        const sign = delta > 0 ? '+' : '';
        return `${sign}${delta}`;
    };

    if (movements.length === 0) {
        return (
            <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500">No movement history available</p>
            </div>
        );
    }

    return (
        <div className="flow-root">
            <ul className="-mb-8">
                {movements.map((movement, idx) => (
                    <li key={movement.id}>
                        <div className="relative pb-8">
                            {idx < movements.length - 1 && (
                                <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                            )}
                            <div className="relative flex items-start space-x-3">
                                <div className="relative">
                                    {getMovementIcon(movement.movement_type)}
                                </div>
                                <div className={`min-w-0 flex-1 bg-white rounded-lg border border-gray-200 p-4 ${getMovementColor(movement.movement_type)} border-l-4`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {movement.movement_type === 'stock_in' && 'Stock In'}
                                                {movement.movement_type === 'stock_out' && 'Stock Out'}
                                                {movement.movement_type === 'adjustment' && 'Stock Adjustment'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatDate(movement.created_at)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-mono font-bold ${movement.movement_type === 'stock_in' ? 'text-green-600' :
                                                    movement.movement_type === 'stock_out' ? 'text-red-600' :
                                                        'text-blue-600'
                                                }`}>
                                                {movement.movement_type === 'stock_in' && '+'}
                                                {movement.movement_type === 'stock_out' && '-'}
                                                {movement.quantity} units
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {movement.quantity_before} → {movement.quantity_after}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">
                                        {movement.note || 'No note provided'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        By: {movement.performed_by_email}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MovementTimeline;