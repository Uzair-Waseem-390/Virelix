import axiosInstance from './axios';

export const getProducts = (projectId, params = {}) =>
    axiosInstance.get(`/projects/${projectId}/products/`, { params });

export const getProduct = (projectId, productId) =>
    axiosInstance.get(`/projects/${projectId}/products/${productId}/`);

export const createProduct = (projectId, data) =>
    axiosInstance.post(`/projects/${projectId}/products/`, data);

export const updateProduct = (projectId, productId, data) =>
    axiosInstance.patch(`/projects/${projectId}/products/${productId}/`, data);

export const deleteProduct = (projectId, productId) =>
    axiosInstance.delete(`/projects/${projectId}/products/${productId}/`);

export const activateProduct = (projectId, productId) =>
    axiosInstance.post(`/projects/${projectId}/products/${productId}/activate/`);

export const deactivateProduct = (projectId, productId) =>
    axiosInstance.post(`/projects/${projectId}/products/${productId}/deactivate/`);