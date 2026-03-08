import axios from "axios";
import { getToken } from "../utils/tokenStorage";

const API = axios.create({
  //baseURL: "https://shecare-backend-1061624847334.asia-south1.run.app/api",
  baseURL: "https://shecare-backend-flui.onrender.com/api",
  timeout: 15000,
});

API.interceptors.request.use((config) => {
  const token = getToken();

  console.log("Token being sent:", token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;