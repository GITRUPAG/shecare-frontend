
// src/api/healthService.js
import API from "./api";

export const getBMI = async () => {
  const res = await API.get("/health/bmi");
  return res.data;
};

export const getHealthRisk = async () => {
  const res = await API.get("/health/risk");
  return res.data;
};