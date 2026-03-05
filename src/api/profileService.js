import API from "./api";

export const getProfile = async () => {
  const res = await API.get("/profile/me");
  return res.data;
};

export const updateProfile = async (data) => {
  const res = await API.put("/profile/me", data);
  return res.data;
};

export const uploadProfileImage = async (formData) => {
  const res = await API.post("/profile/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};