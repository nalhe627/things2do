/**
 * 1. This is the root index route. Currenty it just redirects to
 *    the discovery screen.
 *
 * 2. Ensure this is out of the tabs folder, otherwise it will
 *   be treated as a tab itself.
 *
 * 3. If you want to change the default tab, change the path
 *    in the router.replace() call below.
 */

import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Linking, Platform } from "react-native";
import { useAuth } from "@/context/auth";
import { supabase } from "@/utils/supabase";

export default function Index() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  const [isHandlingDeepLink, setIsHandlingDeepLink] = useState(false);

  useEffect(() => {
    // Handle deep linking for password reset
    const handleDeepLink = async (url: string) => {
      console.log("Deep link received:", url);

      // For web, check hash parameters
      if (Platform.OS === "web" && url.includes("#")) {
        const hashParams = new URLSearchParams(url.split("#")[1]);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        console.log("Hash params detected:", {
          type,
          hasAccessToken: !!accessToken,
        });

        if (type === "recovery" && accessToken && refreshToken) {
          console.log(
            "Recovery link detected, setting session and navigating..."
          );
          setIsHandlingDeepLink(true);

          try {
            // Set the session using the tokens from the URL
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error("Error setting session:", error);
              router.replace("/(auth)/login");
              return;
            }

            console.log(
              "Session set successfully, navigating to reset-password"
            );
            router.replace("/(auth)/reset-password");
          } catch (error) {
            console.error("Error handling recovery link:", error);
            router.replace("/(auth)/login");
          } finally {
            setIsHandlingDeepLink(false);
          }
          return;
        }
      }

      // For native apps, check query parameters
      if (url.includes("type=recovery")) {
        const urlParams = new URLSearchParams(url.split("?")[1]);
        const token = urlParams.get("token");
        const type = urlParams.get("type");

        if (type === "recovery" && token) {
          console.log(
            "Recovery token found (native), navigating to reset-password"
          );
          router.replace({
            pathname: "/(auth)/reset-password",
            params: { token, type },
          });
        }
      }
    };

    // Get initial URL (for cold start)
    if (Platform.OS === "web") {
      // For web, check current URL
      const currentUrl = window.location.href;
      if (currentUrl.includes("#") || currentUrl.includes("type=recovery")) {
        setInitialUrl(currentUrl);
        handleDeepLink(currentUrl);
      }
    } else {
      // For native, use Linking API
      Linking.getInitialURL().then((url) => {
        if (url) {
          setInitialUrl(url);
          handleDeepLink(url);
        }
      });
    }

    // Listen for URL changes (for hot start)
    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  useEffect(() => {
    console.log(
      "Index: loading=",
      loading,
      "session=",
      session ? "exists" : "null",
      "isHandlingDeepLink=",
      isHandlingDeepLink
    );

    if (loading || isHandlingDeepLink) return;

    // Don't navigate if we've handled a deep link
    if (
      initialUrl &&
      (initialUrl.includes("type=recovery") ||
        initialUrl.includes("#access_token"))
    ) {
      return;
    }

    // Use replace to prevent back navigation
    if (session) {
      console.log("Index: Navigating to discovery");
      router.replace("/(tabs)/discovery");
    } else {
      console.log("Index: Navigating to login");
      router.replace("/(auth)/login");
    }
  }, [session, loading, router, initialUrl, isHandlingDeepLink]);

  return (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" />
    </View>
  );
}
