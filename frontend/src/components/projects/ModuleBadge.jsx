const ModuleBadge = ({ module, size = 'sm' }) => {
    const config = {
        products: {
            name: 'Products',
            color: 'bg-blue-100 text-blue-800',
            icon: '📦'
        },
        inventory: {
            name: 'Inventory',
            color: 'bg-orange-100 text-orange-800',
            icon: '📊'
        },
        sales: {
            name: 'Sales',
            color: 'bg-green-100 text-green-800',
            icon: '💰'
        }
    };

    const moduleConfig = config[module];
    if (!moduleConfig) return null;

    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${moduleConfig.color} ${sizeClasses[size]}`}>
            <span>{moduleConfig.icon}</span>
            <span>{moduleConfig.name}</span>
        </span>
    );
};

export default ModuleBadge;