import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, Link, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/auth";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const params = useLocalSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    // Check if redirected from successful signup
    if (params.signupSuccess === "true") {
      setShowSuccess(true);
      // Hide success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }

    // Check if redirected from successful password reset
    if (params.passwordReset === "true") {
      setShowSuccess(true);
      setError(""); // Clear any errors
      // Hide success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [params.signupSuccess, params.passwordReset]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setError("");
    setShowSuccess(false);
    setLoading(true);

    const { error: signInError } = await signIn(email, password);

    setLoading(false);

    if (signInError) {
      setError(signInError);
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      // Show forgot password link after 3 failed attempts or if user exists error
      if (
        newFailedAttempts >= 3 ||
        signInError.toLowerCase().includes("already registered")
      ) {
        setShowForgotPassword(true);
      }
      return;
    }

    // Reset failed attempts on success
    setFailedAttempts(0);
    setShowForgotPassword(false);

    // Navigation happens automatically via context listener in index.tsx
    router.replace("/(tabs)/discovery");
  };

  const handleGoogleSuccess = () => {
    // Google auth success is handled by the callback
    // The auth context will automatically detect the session change
  };

  const handleGoogleError = (error: string) => {
    setError(error);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <View className="flex-1 p-5 justify-center">
        <Text className="text-4xl font-bold mb-2 text-center text-black dark:text-white">
          Welcome Back
        </Text>
        <Text className="text-base text-gray-600 dark:text-gray-300 mb-8 text-center">
          Sign in to continue
        </Text>

        {showSuccess && (
          <View className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
            <Text className="text-green-600 dark:text-green-400 text-sm font-semibold">
              {params.passwordReset === "true"
                ? "✓ Password reset successfully! You can now sign in."
                : "✓ Account created successfully! You can now sign in."}
            </Text>
          </View>
        )}

        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 text-base mb-4 bg-white dark:bg-gray-800 text-black dark:text-white"
          placeholder="Email"
          placeholderTextColor={Platform.OS === "ios" ? undefined : "#9CA3AF"}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError("");
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
          returnKeyType="next"
        />

        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 text-base mb-4 bg-white dark:bg-gray-800 text-black dark:text-white"
          placeholder="Password"
          placeholderTextColor={Platform.OS === "ios" ? undefined : "#9CA3AF"}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError("");
          }}
          secureTextEntry
          editable={!loading}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        {error ? (
          <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
            <Text className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </Text>
            {showForgotPassword && (
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity className="mt-2">
                  <Text className="text-blue-500 dark:text-blue-400 text-sm font-semibold">
                    Forgot your password? Reset it here →
                  </Text>
                </TouchableOpacity>
              </Link>
            )}
          </View>
        ) : null}

        <TouchableOpacity
          className={`bg-blue-500 p-4 rounded-lg items-center mt-2 ${
            loading ? "opacity-60" : ""
          }`}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
          <Text className="mx-4 text-gray-500 dark:text-gray-400 text-sm">
            or
          </Text>
          <View className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
        </View>

        {/* Google Sign In */}
        <GoogleSignInButton
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />

        <View className="flex-row justify-center mt-6">
          <Text className="text-sm text-gray-600 dark:text-gray-300">
            Don&apos;t have an account?{" "}
          </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity disabled={loading}>
              <Text className="text-sm text-blue-500 dark:text-blue-400 font-semibold">
                Sign Up
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Always show forgot password link at bottom */}
        <View className="flex-row justify-center mt-4">
          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity disabled={loading}>
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                Forgot password?
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
