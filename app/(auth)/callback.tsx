// In callback.tsx
import { useEffect } from "react";
import { View, ActivityIndicator, Text, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/utils/supabase";
import * as QueryParams from "expo-auth-session/build/QueryParams";

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const createSessionFromUrl = async (url: string) => {
      const { params, errorCode } = QueryParams.getQueryParams(url);
      if (errorCode) throw new Error(errorCode);
      const { access_token, refresh_token, error } = params as Record<
        string,
        string | undefined
      >;
      if (error) throw new Error(error);
      if (!access_token) return false;
      const { error: setError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (setError) throw setError;
      return true;
    };

    const handleUrlEvent = async ({ url }: { url: string }) => {
      try {
        // Try tokens in fragment/query first
        const set = await createSessionFromUrl(url);
        if (set) {
          router.replace("/(tabs)/discovery");
          return;
        }
        // Fallback to code exchange if present
        if (url.includes("code=")) {
          const { error } = await supabase.auth.exchangeCodeForSession({ url });
          if (!error) {
            router.replace("/(tabs)/discovery");
            return;
          }
          console.error("Exchange code error (event):", error);
        }
      } catch (e) {
        console.error("Deep link event handling error:", e);
        router.replace("/(auth)/login");
      }
    };

    const handleCallback = async () => {
      try {
        if (Platform.OS === "web") {
          // Web: parse search and hash for tokens/errors
          const urlParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1)
          );
          const accessToken =
            urlParams.get("access_token") || hashParams.get("access_token");
          const refreshToken =
            urlParams.get("refresh_token") || hashParams.get("refresh_token");
          const error = urlParams.get("error") || hashParams.get("error");

          if (error) {
            console.error("OAuth error (web):", error);
            router.replace("/(auth)/login");
            return;
          }

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) {
              console.error("Session error (web):", sessionError);
              router.replace("/(auth)/login");
              return;
            }
            router.replace("/(tabs)/discovery");
            return;
          }
        } else {
          // Native: handle any initial link first (tokens-in-hash) then fallback to code exchange
          const initialUrl = await Linking.getInitialURL();

          if (initialUrl) {
            try {
              const set = await createSessionFromUrl(initialUrl);
              if (set) {
                router.replace("/(tabs)/discovery");
                return;
              }
            } catch (e) {
              // continue to code exchange fallback
            }

            if (initialUrl.includes("code=")) {
              const { error } = await supabase.auth.exchangeCodeForSession({
                url: initialUrl,
              });
              if (!error) {
                router.replace("/(tabs)/discovery");
                return;
              }
              console.error("Exchange code error (native):", error);
            }
          }

          // Fallback: accept tokens from route params (implicit flow)
          const accessToken = params.access_token as string | undefined;
          const refreshToken = params.refresh_token as string | undefined;
          const error = params.error as string | undefined;

          if (error) {
            console.error("OAuth error (native):", error);
            router.replace("/(auth)/login");
            return;
          }

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) {
              console.error("Session error (native):", sessionError);
              router.replace("/(auth)/login");
              return;
            }
            router.replace("/(tabs)/discovery");
            return;
          }
        }

        // Final fallback: check if we already have a valid session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("Session check error:", sessionError);
          router.replace("/(auth)/login");
          return;
        }
        if (session) {
          router.replace("/(tabs)/discovery");
        } else {
          router.replace("/(auth)/login");
        }
      } catch (error) {
        console.error("Callback handling error:", error);
        router.replace("/(auth)/login");
      }
    };

    // Listen for deep links that arrive after mount
    const sub = Linking.addEventListener("url", handleUrlEvent);

    // Small delay to ensure URL params are available
    const timer = setTimeout(handleCallback, 100);
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [router, params]);

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className="mt-4 text-base text-gray-600">
        Completing sign in...
      </Text>
    </View>
  );
}
