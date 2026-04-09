import axiosInstance from './axios';

export const listChats = (projectId) =>
    axiosInstance.get(`/projects/${projectId}/ai/chats/`);

export const createChat = (projectId) =>
    axiosInstance.post(`/projects/${projectId}/ai/chats/`);

export const getChat = (projectId, chatId) =>
    axiosInstance.get(`/projects/${projectId}/ai/chats/${chatId}/`);

export const deleteChat = (projectId, chatId) =>
    axiosInstance.delete(`/projects/${projectId}/ai/chats/${chatId}/`);

export const sendMessage = (projectId, chatId, message) =>
    axiosInstance.post(`/projects/${projectId}/ai/chats/${chatId}/send/`, { message });
