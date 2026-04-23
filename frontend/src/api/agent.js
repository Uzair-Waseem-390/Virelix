import axiosInstance from './axios';

export const listChats = (projectId) =>
    axiosInstance.get(`/projects/${projectId}/ai/chats/`);

export const createChat = (projectId) =>
    axiosInstance.post(`/projects/${projectId}/ai/chats/`);

export const getChat = (projectId, chatId) =>
    axiosInstance.get(`/projects/${projectId}/ai/chats/${chatId}/`);

export const deleteChat = (projectId, chatId) =>
    axiosInstance.delete(`/projects/${projectId}/ai/chats/${chatId}/`);

// AI agent calls multiple tools (DB + Gemini API) — give it up to 2 minutes.
// All other endpoints keep the default 10s timeout from axiosInstance.
export const sendMessage = (projectId, chatId, message) =>
    axiosInstance.post(
        `/projects/${projectId}/ai/chats/${chatId}/send/`,
        { message },
        { timeout: 120000 }   // 120 seconds — overrides the instance default
    );

