import axios from "axios";

const api = axios.create({
  baseURL: "https://crm-backend-9zam.onrender.com",
  withCredentials: true,
});

export default api;