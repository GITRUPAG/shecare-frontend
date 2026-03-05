// src/api/periodService.js
import API from "./api";

export const logPeriod = async (data) => {
  const res = await API.post("/period/log", data);
  return res.data;
};

export const predictCycle = async (data) => {
  const res = await API.post("/period/predict", data);
  return res.data;
};

export const getPrediction = async () => {
  const res = await API.get("/period/prediction");
  return res.data;
};

export const getPhaseInsights = async () => {
  const res = await API.get("/period/phase-insights");
  return res.data;
};

export const getAlerts = async () => {
  const res = await API.get("/period/alerts");
  return res.data;
};

export const getCalendar = async () => {
  const res = await API.get("/period/calendar");
  return res.data;
};

export const predictPCOS = async (data) => {
  const res = await API.get("/period/pcos");
  return res.data;
};

// Returns list of all past period logs for the authenticated user
// Backend: GET /api/period/logs
// Response: [{ id, startDate, endDate, duration }, ...]
export const getPeriodLogs = async () => {
  const res = await API.get("/period/logs");
  return res.data;
};

export const getPeriodPrediction = async () => {
  const res = await API.get("/period/prediction");
  return res.data;
};
