export const getDirtyFields = (original, current) => {
    const dirty = {};
    Object.keys(current).forEach(key => {
        if (original[key] !== current[key]) {
            dirty[key] = current[key];
        }
    });
    return dirty;
};

export const formatCurrency = (amount, currency = 'PKR') => {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

export const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export const calculateProfit = (price, costPrice) => {
    if (!costPrice && costPrice !== 0) return null;
    return price - costPrice;
};

export const calculateMargin = (price, costPrice) => {
    if (!costPrice && costPrice !== 0 || price === 0) return null;
    const profit = price - costPrice;
    return (profit / price) * 100;
};