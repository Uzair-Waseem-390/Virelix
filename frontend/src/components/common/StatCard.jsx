import { formatCurrency } from '../../utils/form';

const StatCard = ({ icon, label, value, color = 'blue', onClick }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        orange: 'bg-orange-50 text-orange-600',
        purple: 'bg-purple-50 text-purple-600',
        red: 'bg-red-50 text-red-600',
    };

    const formatValue = () => {
        if (typeof value === 'number') {
            return value.toLocaleString();
        }
        return value;
    };

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-xl shadow-sm p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 mb-1">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{formatValue()}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default StatCard;