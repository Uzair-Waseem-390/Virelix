import axiosInstance from './axios';

export const getMyProfile = () => axiosInstance.get('/accounts/me/');

export const getMyFullProfile = () => axiosInstance.get('/accounts/me/profile/');

export const updateMyProfile = (data) => axiosInstance.patch('/accounts/me/profile/', data);

export const changeMyPassword = (data) => axiosInstance.post('/accounts/me/change-password/', data);

export const deleteMyAccount = () => axiosInstance.delete('/accounts/me/delete/');

export const getTeamMembers = () => axiosInstance.get('/accounts/users/');

export const getMember = (pk) => axiosInstance.get(`/accounts/users/${pk}/`);

export const updateMember = (pk, data) => axiosInstance.patch(`/accounts/users/${pk}/`, data);

export const setMemberPassword = (pk, data) => axiosInstance.post(`/accounts/users/${pk}/change-password/`, data);

export const activateMember = (pk) => axiosInstance.post(`/accounts/users/${pk}/activate/`);

export const deactivateMember = (pk) => axiosInstance.post(`/accounts/users/${pk}/deactivate/`);