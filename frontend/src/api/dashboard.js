import axiosInstance from './axios';

export const getMainDashboard = () =>
    axiosInstance.get('/dashboard/');

export const getProjectDashboard = (projectId) =>
    axiosInstance.get(`/dashboard/projects/${projectId}/`);