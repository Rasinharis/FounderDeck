import api from './axios';

export const getPosts = (params) => api.get('/posts', { params });
export const getMyPosts = (params) => api.get('/posts/mine', { params });
export const getPost = (id) => api.get(`/posts/${id}`);
export const createPost = (data) => api.post('/posts', data);
export const updatePost = (id, data) => api.patch(`/posts/${id}`, data);
export const deletePost = (id) => api.delete(`/posts/${id}`);
export const enhancePitch = (data) => api.post('/ai/enhance-pitch', data);

