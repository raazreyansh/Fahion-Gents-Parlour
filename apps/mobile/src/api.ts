import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { config } from "../config";

const TOKEN_KEY = "auth_token";

export const api = axios.create({
  baseURL: config.apiBaseUrl,
});

// Automatically attach the JWT to every request
api.interceptors.request.use(async (req) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const authStorage = {
  async saveToken(token: string) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async getToken() {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },
  async clearToken() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
};
