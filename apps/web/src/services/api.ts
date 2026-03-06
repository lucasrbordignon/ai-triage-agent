import axios from "axios"

export const api = axios.create({
  baseURL: "/api",
  headers: {
    "x-api-key": import.meta.env.VITE_API_KEY,
  },
})