import axiosInstance from './axios';

export const getInventory = (projectId, params = {}) =>
    axiosInstance.get(`/projects/${projectId}/inventory/`, { params });

export const getInventoryRecord = (projectId, inventoryId) =>
    axiosInstance.get(`/projects/${projectId}/inventory/${inventoryId}/`);

export const createInventory = (projectId, data) => {
    console.log('createInventory API called with:', { projectId, data });
    return axiosInstance.post(`/projects/${projectId}/inventory/`, data);
};

export const updateInventory = (projectId, inventoryId, data) =>
    axiosInstance.patch(`/projects/${projectId}/inventory/${inventoryId}/`, data);

export const deleteInventory = (projectId, inventoryId) =>
    axiosInstance.delete(`/projects/${projectId}/inventory/${inventoryId}/`);

export const stockIn = (projectId, inventoryId, data) =>
    axiosInstance.post(`/projects/${projectId}/inventory/${inventoryId}/stock-in/`, data);

export const stockOut = (projectId, inventoryId, data) =>
    axiosInstance.post(`/projects/${projectId}/inventory/${inventoryId}/stock-out/`, data);

export const adjustStock = (projectId, inventoryId, data) =>
    axiosInstance.post(`/projects/${projectId}/inventory/${inventoryId}/adjust/`, data);

export const getMovements = (projectId, inventoryId, params = {}) =>
    axiosInstance.get(`/projects/${projectId}/inventory/${inventoryId}/movements/`, { params });

export const getProjectMovements = (projectId, params = {}) =>
    axiosInstance.get(`/projects/${projectId}/inventory/movements/`, { params });

export const getLowStock = (projectId) =>
    axiosInstance.get(`/projects/${projectId}/inventory/low-stock/`);

export const getOutOfStock = (projectId) =>
    axiosInstance.get(`/projects/${projectId}/inventory/out-of-stock/`);