import axiosInstance from './axios';

export const getProjects = () => axiosInstance.get('/projects/');

export const getProject = (id) => axiosInstance.get(`/projects/${id}/`);

export const createProject = (data) => axiosInstance.post('/projects/', data);

export const updateProject = (id, data) => axiosInstance.patch(`/projects/${id}/`, data);

export const deleteProject = (id) => axiosInstance.delete(`/projects/${id}/`);

export const getAIStatus = (id, taskId = null) => {
    const url = taskId
        ? `/projects/${id}/ai-status/?task_id=${taskId}`
        : `/projects/${id}/ai-status/`;
    return axiosInstance.get(url);
};

export const updateManager = (id, data) => axiosInstance.patch(`/projects/${id}/manager/`, data);

export const updateStaff = (id, data) => axiosInstance.patch(`/projects/${id}/staff/`, data);

export const getProjectDashboard = (id) => axiosInstance.get(`/projects/${id}/dashboard/`);