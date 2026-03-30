import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMovements, getInventoryRecord } from '../api/inventory';
import MovementTimeline from '../components/inventory/MovementTimeline';

const MovementHistoryPage = () => {
    const { project_pk, inventoryId } = useParams();
    const navigate = useNavigate();

    const projectId = project_pk;
    const invId = inventoryId;

    const [movements, setMovements] = useState([]);
    const [inventory, setInventory] = useState(null);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (projectId && invId) {
            fetchData();
        } else {
            setError('Invalid project or inventory ID');
            setLoading(false);
        }
    }, [projectId, invId, filter]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const inventoryResponse = await getInventoryRecord(projectId, invId);
            setInventory(inventoryResponse.data);

            const params = {};
            if (filter !== 'all') {
                params.type = filter;
            }
            const movementsResponse = await getMovements(projectId, invId, params);
            setMovements(movementsResponse.data);
        } catch (err) {
            console.error('Failed to fetch movement history:', err);
            setError(err.response?.data?.detail || 'Failed to load movement history');
        } finally {
            setLoading(false);
        }
    };

    const filterTabs = [
        { id: 'all', label: 'All' },
        { id: 'stock_in', label: 'Stock In' },
        { id: 'stock_out', label: 'Stock Out' },
        { id: 'adjustment', label: 'Adjustment' }
    ];

    if (!projectId || !invId) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">Invalid project or inventory ID. Please go back and try again.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-3 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="h-12 bg-gray-200 rounded w-full mb-6"></div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-lg shadow p-6 mb-4">
                            <div className="h-20 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={() => navigate(`/dashboard/projects/${projectId}/inventory`)}
                        className="mt-3 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                    >
                        Back to Inventory
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(`/dashboard/projects/${projectId}/inventory`)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Inventory
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Movement History</h1>
                {inventory && (
                    <p className="text-gray-600 mt-2">
                        {inventory.product_name} • SKU: {inventory.product_sku || '—'}
                    </p>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        {filterTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setFilter(tab.id)}
                                className={`px-6 py-3 text-sm font-medium transition-colors ${
                                    filter === tab.id
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Movement Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
                <MovementTimeline movements={movements} />
            </div>

            {/* Footer Stats */}
            {movements.length > 0 && (
                <div className="mt-6 text-center text-sm text-gray-500">
                    Showing {movements.length} movement{movements.length !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
};

export default MovementHistoryPage;
