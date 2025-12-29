import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { useAuth } from "@/context/auth";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [showMatchIndicator, setShowMatchIndicator] = useState(false);
  const [error, setError] = useState("");

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
    return (
      fullName.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length >= 6 &&
      confirmPassword.length > 0 &&
      passwordsMatch
    );
  };

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
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

    const { error: signUpError } = await signUp(email, password, fullName);

    setLoading(false);

    if (signUpError) {
      setError(signUpError);

      // If user already exists, show them a link to reset password
      if (
        signUpError.toLowerCase().includes("already registered") ||
        signUpError.toLowerCase().includes("already exists")
      ) {
        setError(
          `${signUpError}. If you forgot your password, you can reset it.`
        );
      }
      return;
    }

    // Navigate to login with success flag
    router.replace({
      pathname: "/(auth)/login",
      params: { signupSuccess: "true" },
    });
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
          Create Account
        </Text>
        <Text className="text-base text-gray-600 dark:text-gray-300 mb-8 text-center">
          Sign up to get started
        </Text>

        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 text-base mb-4 bg-white dark:bg-gray-800 text-black dark:text-white"
          placeholder="Full Name"
          placeholderTextColor={Platform.OS === "ios" ? undefined : "#9CA3AF"}
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            setError("");
          }}
          editable={!loading}
          returnKeyType="next"
        />

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
          placeholder="Password (min 6 characters)"
          placeholderTextColor={Platform.OS === "ios" ? undefined : "#9CA3AF"}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError("");
          }}
          secureTextEntry
          editable={!loading}
          returnKeyType="next"
        />

        <View className="mb-4">
          <TextInput
            className={`border ${
              showMatchIndicator
                ? passwordsMatch
                  ? "border-green-500"
                  : "border-red-500"
                : "border-gray-300 dark:border-gray-600"
            } rounded-lg p-4 text-base bg-white dark:bg-gray-800 text-black dark:text-white`}
            placeholder="Confirm Password"
            placeholderTextColor={Platform.OS === "ios" ? undefined : "#9CA3AF"}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setError("");
            }}
            secureTextEntry
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
          />
          {showMatchIndicator && (
            <View className="flex-row items-center mt-2 px-1">
              <Text
                className={`text-sm ${
                  passwordsMatch
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
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
          <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
            <Text className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </Text>
            {(error.toLowerCase().includes("already registered") ||
              error.toLowerCase().includes("already exists")) && (
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity className="mt-2">
                  <Text className="text-blue-500 dark:text-blue-400 text-sm font-semibold">
                    Reset your password →
                  </Text>
                </TouchableOpacity>
              </Link>
            )}
          </View>
        ) : null}

        <TouchableOpacity
          className={`p-4 rounded-lg items-center mt-2 ${
            isFormValid() && !loading
              ? "bg-blue-500"
              : "bg-gray-300 dark:bg-gray-600"
          }`}
          onPress={handleSignUp}
          disabled={!isFormValid() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              className={`text-base font-semibold ${
                isFormValid()
                  ? "text-white"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Sign Up
            </Text>
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
            Already have an account?{" "}
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity disabled={loading}>
              <Text className="text-sm text-blue-500 dark:text-blue-400 font-semibold">
                Sign In
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
