import { formatCurrency } from '../../utils/form';

const SalesSummaryBar = ({ summary, onFilterClick }) => {
    const cards = [
        {
            title: 'Total Revenue',
            value: formatCurrency(summary.total_revenue || 0),
            color: 'border-l-green-500',
            bgColor: 'bg-green-50',
            filter: null
        },
        {
            title: 'Confirmed Sales',
            value: summary.total_confirmed_sales || 0,
            color: 'border-l-blue-500',
            bgColor: 'bg-blue-50',
            filter: 'confirmed'
        },
        {
            title: 'Draft Sales',
            value: summary.draft_sales || 0,
            color: 'border-l-amber-500',
            bgColor: 'bg-amber-50',
            filter: 'draft'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {cards.map((card, index) => (
                <div
                    key={index}
                    onClick={() => card.filter && onFilterClick(card.filter)}
                    className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${card.color} ${card.filter ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                >
                    <p className="text-sm text-gray-500 mb-2">{card.title}</p>
                    <p className={`text-2xl font-bold ${card.filter === 'confirmed' ? 'text-blue-600' : card.filter === 'draft' ? 'text-amber-600' : 'text-green-600'}`}>
                        {card.value}
                    </p>
                </div>
            ))}
        </div>
    );
};

export default SalesSummaryBar;