import Constants from "expo-constants";

/**
 * For security, we use Expo Constants or Environment Variables.
 * Make sure to add these to your .env file in the mobile folder.
 */

export const config = {
  // Replace with your local machine's IP (e.g., http://192.168.1.5:4000) 
  // so the physical device can connect to your local server.
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000",
  
  // Paste your Android Client ID from Google Cloud Console here
  androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID ?? "",
  
  // Paste your Web Client ID from Google Cloud Console here 
  // (Google Auth Session often needs the Web Client ID for verification)
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID ?? "",
};
