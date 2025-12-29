import { useState } from "react";
import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/utils/supabase";
import { Platform } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as QueryParams from "expo-auth-session/build/QueryParams";

// Required for web
WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const redirectUrl = makeRedirectUri({
        scheme: "com.things2do",
        path: "callback",
      });

      // IMPORTANT: Add this exact URL to Supabase > Authentication > URL Configuration > Redirect URLs.
      // If it doesn't match exactly, Supabase will fall back to the Site URL.
      console.log("Add this to Supabase Redirect URLs:", redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Platform.OS !== "web",
        },
      });

      if (error) throw error;

      // On mobile, open the OAuth URL in browser
      if (Platform.OS !== "web" && data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === "success" && result.url) {
          try {
            const set = await createSessionFromUrl(result.url);
            if (!set && result.url.includes("code=")) {
              // Optional code exchange fallback
              const { error: exchError } =
                await supabase.auth.exchangeCodeForSession({
                  url: result.url,
                });
              if (exchError) throw exchError;
            }
            onSuccess?.();
            router.replace("/(tabs)/discovery");
            return;
          } catch (sessErr: any) {
            console.error("OAuth session creation error:", sessErr);
            onError?.(sessErr.message || "Failed to create session");
          }
        } else if (result.type === "cancel") {
          setLoading(false);
          return;
        }
      }
      // On web, Supabase handles the redirect automatically
    } catch (error: any) {
      console.error("Google sign in error:", error);
      onError?.(error.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      className="bg-white border border-gray-300 p-3 rounded-lg items-center flex-row justify-center"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
      onPress={handleGoogleSignIn}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#4285F4" />
      ) : (
        <View className="flex-row items-center justify-center">
          <Image
            source={{
              uri: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
            }}
            style={{ width: 18, height: 18, marginRight: 10 }}
            contentFit="contain"
          />
          <Text className="text-base font-medium" style={{ color: "#3c4043" }}>
            Sign in with Google
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
