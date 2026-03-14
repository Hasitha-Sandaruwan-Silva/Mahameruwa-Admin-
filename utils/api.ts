import axios from "axios";
import { API_BASE_URL } from "./constants";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Allow callers to handle errors; we just normalize message here.
    if (error.response?.data?.detail) {
      error.message = error.response.data.detail as string;
    }
    return Promise.reject(error);
  },
);

