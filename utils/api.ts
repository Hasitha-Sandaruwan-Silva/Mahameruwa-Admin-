import axios from "axios";
import { API_BASE_URL } from "./constants";
import { authStorage } from "./auth"; 

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


apiClient.interceptors.request.use(
  (config) => {
    const token = authStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
   
    if (error.response?.data?.detail) {
      error.message = error.response.data.detail as string;
    }
    return Promise.reject(error);
  },
);