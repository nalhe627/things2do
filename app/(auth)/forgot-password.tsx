import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { supabase } from "@/utils/supabase";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Use a simpler redirect URL that points directly to our route group
      const redirectUrl =
        Platform.OS === "web"
          ? `${window.location.origin}/(auth)/reset-password`
          : `exp://localhost:8081/--/(auth)/reset-password`; // For Expo Go

      console.log("Sending reset email with redirect:", redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (error: any) {
      setError(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View className="flex-1 bg-white p-5 justify-center">
        <View className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <Text className="text-green-600 text-lg font-semibold mb-2">
            ✓ Check your email!
          </Text>
          <Text className="text-green-700 text-base">
            We&apos;ve sent a password reset link to {email}. Please check your inbox
            and follow the instructions.
          </Text>
        </View>

        <TouchableOpacity
          className="bg-blue-500 p-4 rounded-lg items-center"
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text className="text-white text-base font-semibold">
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
          Reset Password
        </Text>
        <Text className="text-base text-gray-600 mb-8 text-center">
          Enter your email and we&apos;ll send you a reset link
        </Text>

        <TextInput
          className="border border-gray-300 rounded-lg p-4 text-base mb-4"
          placeholder="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError("");
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <Text className="text-red-600 text-sm">{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          className={`bg-blue-500 p-4 rounded-lg items-center mt-2 ${
            loading ? "opacity-60" : ""
          }`}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">
              Send Reset Link
            </Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-sm text-gray-600">
            Remember your password?{" "}
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity disabled={loading}>
              <Text className="text-sm text-blue-500 font-semibold">
                Sign In
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
