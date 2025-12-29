import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter, Stack } from "expo-router";
import { useAuth } from "@/context/auth";
import { ProfileApi, UpdateProfileParams } from "@/api/profile/index";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedPressable } from "@/components/themed-pressable";
import { ThemedTextInput } from "@/components/themed-text-input";
import { useThemeContext, Theme } from "@/constants/theme-context";
import { THEME, Colors } from "@/constants/theme";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { supabase } from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";

import * as FileSystem from "expo-file-system/legacy";
import "@/global.css";

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useThemeContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U';

  // Fetch current profile data
  useEffect(() => {
    if (!user?.id) {
      setError("No user authenticated.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const profile = await ProfileApi.getProfile(user.id);
        setFullName(profile.full_name || "");
        setLocation(profile.location || "");
        setBio(profile.bio || "");
        setAvatarUrl(profile.avatar_url || null);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  /**
   * Asks for permission and opens the device's image library.
   * Allows picking one image.
   */
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Permission to access gallery is required to change your profile picture.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false, // Only one image for profile pic
      allowsEditing: true, // Allow user to crop
      quality: 0.8,
      aspect: [1, 1], // Square aspect ratio
    });

    if (!result.canceled) {
      // Set the local URI to show an immediate preview
      setAvatarUrl(result.assets[0].uri);
    }
  };

  /**
   * Uploads a local image file (from ImagePicker) to Supabase Storage.
   *
   * @param localUri The `file://` URI of the image.
   * @param userId The user's ID to create a unique file path.
   * @returns The public URL of the uploaded image.
   */
  const uploadAvatar = async (
  localUri: string,
  userId: string,
): Promise<string> => {
  try {
    // 1. Read the file into a base64 string
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 2. Convert base64 to Uint8Array
    const binary = Uint8Array.from(atob(base64), (c: any) => c.charCodeAt(0));

    // 3. Upload the Uint8Array
    const fileExt = localUri.split(".").pop() || "jpg";
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `avatars/${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, binary, {
        contentType: `image/${fileExt === "png" ? "png" : "jpeg"}`,
        cacheControl: "3600",
        upsert: false,
      });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);

      if (!data.publicUrl) {
        throw new Error("Failed to get public URL after upload.");
      }

      return data.publicUrl;
    } catch (err: any) {
      console.error("Error uploading avatar:", err);
      Alert.alert("Upload Failed", "Failed to upload new profile picture.");
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  // 2. Handle saving 
  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert("Error", "You must be logged in to save.");
      return;
    }

    if (!fullName.trim()) {
      Alert.alert("Missing Info", "Full name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let newAvatarUrl: string | undefined = undefined;

      // Check if avatarUrl is a new file
      if (avatarUrl && avatarUrl.startsWith("file://")) {
        newAvatarUrl = await uploadAvatar(avatarUrl, user.id);
      }

      const updates: UpdateProfileParams = {
        full_name: fullName.trim(),
        location: location.trim(),
        bio: bio.trim(),
      };

      // Only add avatar_url if a new one was uploaded
      if (newAvatarUrl) {
        updates.avatar_url = newAvatarUrl;
      }

      await ProfileApi.updateProfile(user.id, updates);

      setSaving(false);
      
      if (newAvatarUrl) {
        setAvatarUrl(newAvatarUrl);
      }
      
      Alert.alert("Success", "Profile updated!");
      router.back(); // Go back to the profile screen
    } catch (err: any) {
      setSaving(false);
      setError(err.message || "Failed to save profile.");
      Alert.alert("Error", err.message || "Failed to save profile.");
    }
  };

  const currentLoading = loading || isUploading || saving;

  if (loading) {
    return (
      <ThemedView variant="secondary" className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  // Use a placeholder if avatarUrl is null
  const displayAvatar = avatarUrl || `https://placehold.co/80x80/6366f1/ffffff?text=${initials}`;

  return (
    <ThemedView variant="secondary" className="flex-1">
      <Stack.Screen options={{ title: "Edit Profile" }} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center" }} 
      >
        <ThemedView className="w-full max-w-lg px-4 pt-4">
          {/* --- Avatar Section --- */}
          <ThemedView className="items-center w-full mb-6">
            <Image
              source={{ uri: displayAvatar }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 2,
                borderColor: THEME[theme].border,
              }}
              contentFit="cover"
            />
            <ThemedPressable
              variant="muted"
              className="flex-row items-center space-x-1 p-2 mt-2"
              onPress={handlePickImage}
              disabled={currentLoading}
            >
              <Ionicons name="camera" size={16} color={Colors[theme].tint} />
              <ThemedText
                style={{ color: Colors[theme].tint }}
                className="text-base font-semibold"
              >
                Change Photo
              </ThemedText>
            </ThemedPressable>
          </ThemedView>

          {/* Wrap the form in a 'card' view*/}
          <ThemedView
            variant="card"
            className="w-full border border-border rounded-xl p-4 shadow-md space-y-4"
          >
            {error && (
              <ThemedText className="text-red-500 text-center mb-2">
                {error}
              </ThemedText>
            )}

            {/* Form fields */}
            <View>
              <ThemedText className="text-sm font-medium text-muted-foreground mb-1">
                Full Name
              </ThemedText>
              <ThemedTextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your Full Name"
                className="text-base p-3 border border-border rounded-lg"
                editable={!currentLoading}
              />
            </View>

            <View>
              <ThemedText className="text-sm font-medium text-muted-foreground mb-1">
                Location
              </ThemedText>
              <ThemedTextInput
                value={location}
                onChangeText={setLocation}
                placeholder="City, Country"
                className="text-base p-3 border border-border rounded-lg"
                editable={!currentLoading}
              />
            </View>

            <View>
              <ThemedText className="text-sm font-medium text-muted-foreground mb-1">
                Bio
              </ThemedText>
              <ThemedTextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us a little about yourself..."
                multiline
                numberOfLines={4}
                className="text-base h-24 p-3 border border-border rounded-lg"
                style={{ height: 96, textAlignVertical: "top" }}
                editable={!currentLoading}
              />
            </View>
          </ThemedView>

          {/* Save Button (outside the card, but inside the container) */}
          <ThemedPressable
            variant="primary"
            className="w-full p-4 rounded-lg items-center justify-center mt-6 mb-8" // Added margin
            onPress={handleSave}
            disabled={currentLoading}
          >
            {currentLoading ? (
              <ActivityIndicator color={THEME[theme].primaryForeground} />
            ) : (
              <Text
                style={{ color: THEME[theme].primaryForeground }}
                className="text-base font-semibold"
              >
                Save Changes
              </Text>
            )}
          </ThemedPressable>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}