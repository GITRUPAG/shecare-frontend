import API from "./api";

// export const createPost = async (data) => {
//   const res = await API.post("/community/posts", data);
//   return res.data;
// };

export const createPost = async (postData, mediaFile = null) => {
  const formData = new FormData();

  // JSON part — Blob forces Content-Type: application/json on this part
  formData.append(
    "data",
    new Blob([JSON.stringify(postData)], { type: "application/json" })
  );

  // File part — optional; Spring ignores it when required = false
  if (mediaFile) {
    formData.append("file", mediaFile);
  }

  const res = await API.post("/community/posts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getFeed = async (category, hashtag, page = 0) => {
  const res = await API.get("/community/feed", {
    params: { category, hashtag, page },
  });

  return res.data;
};

export const getMyPosts = async () => {
  const res = await API.get("/community/my-posts");
  return res.data;
};

export const likePost = async (postId) => {
  const res = await API.post(`/community/posts/${postId}/like`);
  return res.data;
};

export const addComment = async (postId, data) => {
  const res = await API.post(`/community/posts/${postId}/comment`, data);
  return res.data;
};

export const replyComment = async (commentId, data) => {
  const res = await API.post(`/community/comments/${commentId}/reply`, data);
  return res.data;
};

export const getComments = async (postId) => {
  const res = await API.get(`/community/posts/${postId}/comments`);
  return res.data;
};

export const repostPost = async (postId) => {
  const res = await API.post(`/community/posts/${postId}/repost`);
  return res.data;
};

export const bookmarkPost = async (postId) => {
  const res = await API.post(`/community/posts/${postId}/bookmark`);
  return res.data;
};

export const searchByHashtag = async (hashtag) => {
  const res = await API.get("/community/search", {
    params: { hashtag },
  });

  return res.data;
};

export const reportPost = async (postId, reason) => {
  const res = await API.post(`/community/posts/${postId}/report`, null, {
    params: { reason },
  });

  return res.data;
};

export const getTrendingPosts = async (page = 0) => {
  const res = await API.get("/community/trending", { params: { page } });
  return res.data;
};