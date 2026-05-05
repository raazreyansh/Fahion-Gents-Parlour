import { useState, useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { api, authStorage } from "./api";
import { config } from "../config";

WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: config.androidClientId,
    webClientId: config.webClientId,
  });

  useEffect(() => {
    checkLocalToken();
  }, []);

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      handleGoogleLogin(id_token);
    }
  }, [response]);

  async function checkLocalToken() {
    try {
      const token = await authStorage.getToken();
      if (token) {
        const res = await api.get("/api/auth/me"); // We should add this endpoint to the API
        setUser(res.data.user);
      }
    } catch (e) {
      await authStorage.clearToken();
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin(idToken: string) {
    try {
      setLoading(true);
      const res = await api.post("/api/auth/google", { idToken });
      await authStorage.saveToken(res.data.accessToken);
      setUser(res.data.user);
    } catch (e) {
      console.error("Login failed", e);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await authStorage.clearToken();
    setUser(null);
  }

  return {
    user,
    loading,
    login: () => promptAsync(),
    logout,
    canLogin: !!request
  };
}
