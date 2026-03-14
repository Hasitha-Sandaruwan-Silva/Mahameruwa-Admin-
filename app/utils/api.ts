"use client";

import axios from "axios";
import { API_BASE_URL } from "./constants";
import { authStorage } from "./auth";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

