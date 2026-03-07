// src/api/periodService.js
import API from "./api";

// ─── Token helpers ────────────────────────────────────────────────────────────
const TOKEN_KEY = "shecare_token";
export const saveToken   = (token) => localStorage.setItem(TOKEN_KEY, token);
export const getToken    = ()      => localStorage.getItem(TOKEN_KEY);
export const removeToken = ()      => localStorage.removeItem(TOKEN_KEY);

// ─── Auth header helper ───────────────────────────────────────────────────────
const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── Period endpoints ─────────────────────────────────────────────────────────
export const logPeriod = async (data) => {
  const res = await API.post("/period/log", data, { headers: authHeader() });
  return res.data;
};

export const predictCycle = async (data) => {
  const res = await API.post("/period/predict", data, { headers: authHeader() });
  return res.data;
};

export const getPrediction = async () => {
  const res = await API.get("/period/prediction", { headers: authHeader() });
  return res.data;
};

export const getPhaseInsights = async () => {
  const res = await API.get("/period/phase-insights", { headers: authHeader() });
  return res.data;
};

export const getAlerts = async () => {
  const res = await API.get("/period/alerts", { headers: authHeader() });
  return res.data;
};

export const getCalendar = async () => {
  const res = await API.get("/period/calendar", { headers: authHeader() });
  return res.data;
};

export const predictPCOS = async () => {
  const res = await API.get("/period/pcos", { headers: authHeader() });
  return res.data;
};

export const getPeriodLogs = async () => {
  const res = await API.get("/period/logs", { headers: authHeader() });
  return res.data;
};

export const getPeriodPrediction = async () => {
  const res = await API.get("/period/prediction", { headers: authHeader() });
  return res.data;
};

export const editPeriodLog    = (id, data)   => API.put(`/period/log/${id}`, data).then(r => r.data);
export const deletePeriodLog  = (id)         => API.delete(`/period/log/${id}`).then(r => r.data);

export const savePcosSymptoms = async (data)  => (await API.post("/period/pcos/symptoms", data)).data;