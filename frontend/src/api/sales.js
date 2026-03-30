import axiosInstance from './axios';

export const getSales = (projectId, params = {}) =>
    axiosInstance.get(`/projects/${projectId}/sales/`, { params });

export const getSale = (projectId, saleId) => {
    console.log('Fetching sale:', { projectId, saleId }); // Debug log
    return axiosInstance.get(`/projects/${projectId}/sales/${saleId}/`);
};

export const createSale = (projectId, data) =>
    axiosInstance.post(`/projects/${projectId}/sales/`, data);

export const updateSale = (projectId, saleId, data) =>
    axiosInstance.patch(`/projects/${projectId}/sales/${saleId}/`, data);

export const deleteSale = (projectId, saleId) =>
    axiosInstance.delete(`/projects/${projectId}/sales/${saleId}/`);

export const confirmSale = (projectId, saleId) =>
    axiosInstance.post(`/projects/${projectId}/sales/${saleId}/confirm/`);

export const cancelSale = (projectId, saleId) =>
    axiosInstance.post(`/projects/${projectId}/sales/${saleId}/cancel/`);

export const addSaleItem = (projectId, saleId, data) =>
    axiosInstance.post(`/projects/${projectId}/sales/${saleId}/items/`, data);

export const updateSaleItem = (projectId, saleId, itemId, data) =>
    axiosInstance.patch(`/projects/${projectId}/sales/${saleId}/items/${itemId}/`, data);

export const removeSaleItem = (projectId, saleId, itemId) =>
    axiosInstance.delete(`/projects/${projectId}/sales/${saleId}/items/${itemId}/`);

export const getSalesSummary = (projectId) =>
    axiosInstance.get(`/projects/${projectId}/sales/summary/`);