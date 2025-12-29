import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/utils/supabase";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [showMatchIndicator, setShowMatchIndicator] = useState(false);

  useEffect(() => {
    const checkForErrors = () => {
      // Check for errors in URL hash (web) or query params
      let errorFromUrl = null;
      let errorCode = null;
      let errorDescription = null;

      if (Platform.OS === "web" && typeof window !== "undefined") {
        // Handle direct navigation from Supabase redirect
        // Check if we're being redirected from /auth/reset-password
        const currentPath = window.location.pathname;
        if (currentPath === "/auth/reset-password") {
          // Extract hash parameters and redirect to proper route
          const hash = window.location.hash;
          const search = window.location.search;

          let redirectParams: Record<string, string> = {};

          if (hash) {
            const hashParams = new URLSearchParams(hash.substring(1));
            hashParams.forEach((value, key) => {
              redirectParams[key] = value;
            });
          }

          if (search) {
            const searchParams = new URLSearchParams(search);
            searchParams.forEach((value, key) => {
              redirectParams[key] = value;
            });
          }

          // Replace the URL to the correct route
          const newUrl =
            Object.keys(redirectParams).length > 0
              ? `/(auth)/reset-password?${new URLSearchParams(
                  redirectParams
                ).toString()}`
              : "/(auth)/reset-password";

          router.replace({
            pathname: "/(auth)/reset-password",
            params: redirectParams,
          });
          return;
        }

        // Parse query parameters for web (from redirect)
        const searchParams = new URLSearchParams(window.location.search);
        errorFromUrl = searchParams.get("error");
        errorCode = searchParams.get("error_code");
        errorDescription = searchParams.get("error_description");

        // Also check hash parameters as fallback
        if (!errorFromUrl) {
          const hash = window.location.hash;
          const hashParams = new URLSearchParams(hash.substring(1));
          errorFromUrl = hashParams.get("error");
          errorCode = hashParams.get("error_code");
          errorDescription = hashParams.get("error_description");
        }
      } else {
        // Check query params for mobile
        errorFromUrl = params.error as string;
        errorCode = params.error_code as string;
        errorDescription = params.error_description as string;
      }

      if (errorFromUrl) {
        console.log("Error detected:", {
          errorFromUrl,
          errorCode,
          errorDescription,
        });

        if (errorCode === "otp_expired" || errorFromUrl === "access_denied") {
          setTokenError(
            errorDescription
              ? decodeURIComponent(errorDescription).replace(/\+/g, " ")
              : "Your reset link has expired or is invalid. Please request a new one."
          );
        } else {
          setTokenError(
            "There was an error with your reset link. Please try again."
          );
        }
        setVerifying(false);
        return;
      }

      // If no errors in URL, proceed with normal token verification
      verifyToken();
    };

    // Verify the token from the URL when component mounts
    const verifyToken = async () => {
      try {
        // For web with hash-based auth, the session is already set by index.tsx
        // Just check if we have a valid session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          setTokenError("Failed to verify your session. Please try again.");
          setVerifying(false);
          return;
        }

        if (!session) {
          console.error("No session found");
          setTokenError(
            "Your reset link has expired or is invalid. Please request a new one."
          );
          setVerifying(false);
          return;
        }

        console.log("Session verified successfully");
        setVerifying(false);
      } catch (error: any) {
        console.error("Verification error:", error);
        setTokenError("Failed to verify reset link. Please try again.");
        setVerifying(false);
      }
    };

    checkForErrors();
  }, [params, router]);

  useEffect(() => {
    if (confirmPassword.length > 0) {
      setShowMatchIndicator(true);
      setPasswordsMatch(password === confirmPassword);
    } else {
      setShowMatchIndicator(false);
      setPasswordsMatch(true);
    }
  }, [password, confirmPassword]);

  const isFormValid = () => {
    return password.length >= 6 && confirmPassword.length > 0 && passwordsMatch;
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // The session is already set from the token verification
      // Now we can update the password
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      // Success! Navigate to login with success message
      router.replace({
        pathname: "/(auth)/login",
        params: { passwordReset: "true" },
      });
    } catch (error: any) {
      setError(error.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while verifying token
  if (verifying) {
    return (
      <View className="flex-1 bg-white justify-center items-center p-5">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-base text-gray-600 mt-4">
          Verifying reset link...
        </Text>
      </View>
    );
  }

  // Show error if token is invalid
  if (tokenError) {
    return (
      <View className="flex-1 bg-white justify-center p-5">
        <View className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <Text className="text-red-600 text-lg font-semibold mb-2">
            ✗ Reset Link Error
          </Text>
          <Text className="text-red-700 text-base mb-4">{tokenError}</Text>
        </View>

        <TouchableOpacity
          className="bg-blue-500 p-4 rounded-lg items-center mb-3"
          onPress={() => router.replace("/(auth)/forgot-password")}
        >
          <Text className="text-white text-base font-semibold">
            Request New Reset Link
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-200 p-4 rounded-lg items-center"
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text className="text-gray-700 text-base font-semibold">
            Back to Sign In
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View className="flex-1 p-5 justify-center">
        <Text className="text-4xl font-bold mb-2 text-center">
          Set New Password
        </Text>
        <Text className="text-base text-gray-600 mb-8 text-center">
          Enter your new password below
        </Text>

        <TextInput
          className="border border-gray-300 rounded-lg p-4 text-base mb-4"
          placeholder="New Password (min 6 characters)"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError("");
          }}
          secureTextEntry
          editable={!loading}
        />

        <View className="mb-4">
          <TextInput
            className={`border ${
              showMatchIndicator
                ? passwordsMatch
                  ? "border-green-500"
                  : "border-red-500"
                : "border-gray-300"
            } rounded-lg p-4 text-base`}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setError("");
            }}
            secureTextEntry
            editable={!loading}
          />
          {showMatchIndicator && (
            <View className="flex-row items-center mt-2 px-1">
              <Text
                className={`text-sm ${
                  passwordsMatch ? "text-green-600" : "text-red-600"
                }`}
              >
                {passwordsMatch
                  ? "✓ Passwords match"
                  : "✗ Passwords do not match"}
              </Text>
            </View>
          )}
        </View>

        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <Text className="text-red-600 text-sm">{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          className={`p-4 rounded-lg items-center mt-2 ${
            isFormValid() && !loading ? "bg-blue-500" : "bg-gray-300"
          }`}
          onPress={handleResetPassword}
          disabled={!isFormValid() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              className={`text-base font-semibold ${
                isFormValid() ? "text-white" : "text-gray-500"
              }`}
            >
              Reset Password
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
