import { Image } from "expo-image";
import {
  Platform,
  TouchableOpacity,
  Text,
  Alert,
  ScrollView,
  ActivityIndicator,
  View,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ThemedPressable } from "@/components/themed-pressable";
import { useThemeContext, Theme } from "@/constants/theme-context";
import { THEME, Colors } from "@/constants/theme";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { useAuth } from "@/context/auth";
import { ProfileApi, Profile, UserReview } from "@/api/profile/index"; // Import API functions and type
import "@/global.css";

/*

AI ACKNOWLEDGEMENT

Google's Gemini was used to write the boilerplate code for the React component's structure, layout logic, and state initialization. 
The AI provided initial solutions for the inline profile layout and the dark mode toggle implementation. The student was responsible for 
debugging type conflicts, resolving layout issues, and ensuring all components correctly connect to the application's global state and authentication context.

*/

// --- EXTENDED PROFILE TYPE FOR LOCAL USE ---
// Since the external Profile interface might be minimal (e.g., only DB fields),
// we extend it here to include all the display/computed fields used by the UI.
interface FullProfile extends Profile {
  reviewCount: number;
  reviewRating: number;
  reviewAuthor: string;
  reviewTime: string;
  initials: string; // Used for avatar placeholder text
}

// --- Static Placeholder Data (Used ONLY when a database field isn't available) ---
const DEFAULT_USER_DATA: Partial<FullProfile> = {
  rating: 0,
  location: "Unknown Location",
  bio: "No bio available.",
  attended: 0,
  created: 0,
  followers: 0,
  following: 0,
  reviewCount: 0,
  reviewRating: 0,
  reviewAuthor: "N/A",
  reviewTime: "N/A",
  initials: "U", // Default initial for placeholder
};

// Placeholder component for the user review card
function UserReviewCard({ review }: { review: UserReview }) {
  const { theme } = useThemeContext();
  const iconColor = "text-amber-500";

  const timeAgo = new Date(review.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <ThemedView
      variant="card"
      className="p-4 rounded-lg flex-row items-start space-x-3 border border-border mb-3"
    >
      <Image
        source={{ uri: review.reviewer_avatar_url }}
        style={{ width: 40, height: 40, borderRadius: 20 }}
      />
      <ThemedView variant="card" className="flex-1 space-y-1 mx-4">
        <ThemedText variant="subheader" className="text-base font-semibold">
          {review.reviewer_name}
        </ThemedText>
        <ThemedView
          variant="card"
          className="flex-row items-center justify-between"
        >
          <ThemedView
            variant="card"
            className="flex-row items-center space-x-1"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons
                key={i}
                name={i <= review.rating ? "star" : "star-outline"}
                size={14}
                color="#FFD700"
              />
            ))}
          </ThemedView>
          <ThemedText
            variant="subheader"
            className="text-xs text-muted-foreground"
          >
            {timeAgo}
          </ThemedText>
        </ThemedView>
        <ThemedText
          variant="subheader"
          className="text-sm text-muted-foreground mt-1"
        >
          {review.text}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

// --- Main Component ---

export default function ProfileScreen() {
  const { theme, setTheme } = useThemeContext();
  const router = useRouter();
  const { user, signOut } = useAuth();

  // State for DB data fetching, using the combined type
  const [profileData, setProfileData] = useState<FullProfile | null>(null);
  const [userReviews, setUserReviews] = useState<UserReview[]>([]); // New state for reviews
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const tintColor = Colors[theme].tint;

  // Function to fetch all necessary profile data
  const fetchAllProfileData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch User Data from public.users
      const userData = await ProfileApi.getProfile(userId);

      // Calculate initials from the full_name field in the public.users table
      const fullName = userData.full_name || user?.email || "User Name";
      const initials =
        fullName
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase() || "U";

      // 2. Fetch Reviews
      const reviews = await ProfileApi.getReviewsForUser(userId);
      setUserReviews(reviews);

      // Calculate aggregated rating and review count from fetched reviews
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating =
        reviews.length > 0
          ? totalRating / reviews.length
          : DEFAULT_USER_DATA.rating!;

      // Map data directly from the API response or use sensible defaults
      const fetchedProfile: FullProfile = {
        // Core DB fields
        id: userData.id,
        full_name: userData.full_name || user?.email || "User Name",
        avatar_url: userData.avatar_url || "",
        // Use userData.created_at which is the registration time from the public.users table
        member_since: userData.created_at
          ? new Date(userData.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
            })
          : DEFAULT_USER_DATA.member_since!,

        // Extended/Placeholder fields
        initials: initials,
        rating: avgRating, // Use calculated average rating
        location: userData.location || DEFAULT_USER_DATA.location!,
        bio: userData.bio || DEFAULT_USER_DATA.bio!,
        attended: DEFAULT_USER_DATA.attended!, // Placeholder stats
        created: DEFAULT_USER_DATA.created!, // Placeholder stats
        followers: DEFAULT_USER_DATA.followers!, // Placeholder stats
        following: DEFAULT_USER_DATA.following!, // Placeholder stats
        reviewCount: reviews.length, // Use actual count
        reviewRating: avgRating, // Use actual average rating
        reviewAuthor: DEFAULT_USER_DATA.reviewAuthor!,
        reviewTime: DEFAULT_USER_DATA.reviewTime!,
      };

      // Handle placeholder/default avatar logic here
      if (
        !fetchedProfile.avatar_url ||
        !fetchedProfile.avatar_url.startsWith("http")
      ) {
        fetchedProfile.avatar_url = `https://placehold.co/80x80/6366f1/ffffff?text=${fetchedProfile.initials}`;
      }

      setProfileData(fetchedProfile);
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      if (user?.id) {
        setError(
          err.message ||
            "Failed to load profile data. Please check connection/permissions."
        );
      } else {
        setError("User not authenticated or session invalid.");
      }
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadData = async (userId: string) => {
        try {
          // If profileData already exists, we'll just refresh in the background
          if (!profileData) {
            setLoading(true);
          }
          setError(null);

          // 1. Fetch User Data
          const userData = await ProfileApi.getProfile(userId);

          const fullName = userData.full_name || user?.email || "User Name";
          const initials =
            fullName
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase() || "U";

          // 2. Fetch Reviews
          const reviews = await ProfileApi.getReviewsForUser(userId);
          setUserReviews(reviews);

          // 3. Calculate aggregates
          const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
          const avgRating =
            reviews.length > 0
              ? totalRating / reviews.length
              : DEFAULT_USER_DATA.rating!;

          // 4. Map data
          const fetchedProfile: FullProfile = {
            id: userData.id,
            full_name: userData.full_name || user?.email || "User Name",
            avatar_url: userData.avatar_url || "",
            member_since: userData.created_at
              ? new Date(userData.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })
              : DEFAULT_USER_DATA.member_since!,
            initials: initials,
            rating: avgRating,
            location: userData.location || DEFAULT_USER_DATA.location!,
            bio: userData.bio || DEFAULT_USER_DATA.bio!,
            attended: DEFAULT_USER_DATA.attended!,
            created: DEFAULT_USER_DATA.created!,
            followers: DEFAULT_USER_DATA.followers!,
            following: DEFAULT_USER_DATA.following!,
            reviewCount: reviews.length,
            reviewRating: avgRating,
            reviewAuthor: DEFAULT_USER_DATA.reviewAuthor!,
            reviewTime: DEFAULT_USER_DATA.reviewTime!,
          };

          if (
            !fetchedProfile.avatar_url ||
            !fetchedProfile.avatar_url.startsWith("http")
          ) {
            fetchedProfile.avatar_url = `https://placehold.co/80x80/6366f1/ffffff?text=${fetchedProfile.initials}`;
          }

          setProfileData(fetchedProfile);
        } catch (err: any) {
          console.error("Error fetching profile:", err);
          if (user?.id) {
            setError(
              err.message ||
                "Failed to load profile data. Please check connection/permissions."
            );
          } else {
            setError("User not authenticated or session invalid.");
          }
          setProfileData(null);
        } finally {
          setLoading(false);
        }
      };

      if (user?.id) {
        loadData(user.id);
      } else if (!user && !loading) {
        setLoading(true);
      }
    }, [user?.id, user?.email, profileData]) // Add profileData as dependency
  );

  // Use profileData directly, ensuring null checks cover cases where profileData is null
  const currentProfile: FullProfile =
    profileData || (DEFAULT_USER_DATA as FullProfile);
  const displayName = currentProfile.full_name || "User Name";
  const displayAvatar =
    currentProfile.avatar_url ||
    `https://placehold.co/80x80/6366f1/ffffff?text=${
      currentProfile.initials || "U"
    }`;

  const handleLightDarkToggle = () => {
    const newTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  const handleSignOutPress = () => {
    if (Platform.OS === "android") {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        {
          text: "Cancel",
          style: "cancel",
          onPress: handleSignOutCancel,
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: handleSignOutConfirm,
        },
      ]);
    } else {
      setShowSignOutModal(true);
    }
  };

  const handleSignOutConfirm = async () => {
    try {
      setShowSignOutModal(false);
      const { error } = await signOut();

      if (error) {
        Alert.alert("Error", `Failed to sign out: ${error}`);
        return;
      }

      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Sign out error in component:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  const handleSignOutCancel = () => {
    setShowSignOutModal(false);
  };

  // --- UI RENDERING ---

  if (loading || !user) {
    return (
      <ThemedView
        variant="secondary"
        className="flex-1 justify-center items-center"
      >
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  if (error && !profileData) {
    return (
      <ThemedView
        variant="secondary"
        className="flex-1 justify-center items-center p-6"
      >
        <Ionicons name="alert-circle-outline" size={32} color="red" />
        <ThemedText className="mt-4 text-xl text-red-500 font-bold">
          Error Loading Profile
        </ThemedText>
        <ThemedText className="mt-2 text-center text-sm text-muted-foreground">
          {error}
        </ThemedText>
        <ThemedText className="mt-4 text-sm text-center text-muted-foreground">
          Please check your connection and try again.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center" }}
        style={{ backgroundColor: THEME[theme].secondary }}
      >
        <ThemedView
          variant="secondary"
          className="flex-1 items-center px-4 pt-4 w-full max-w-lg"
        >
          {/* Profile Details Layout */}
          <ThemedView
            variant="secondary"
            className="w-full flex-row items-start"
          >
            {/* Profile Image Column (Left) */}
            <View className="w-20 h-20 rounded-full bg-secondary items-center justify-center relative flex-shrink-0 mr-4 border-2 border-white">
              {/* Use dynamic avatar URL */}
              <Image
                source={{ uri: displayAvatar }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
                contentFit="cover"
                // Placeholder uses the calculated initials
                defaultSource={{
                  uri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><circle cx="40" cy="40" r="40" fill="#6366f1"/><text x="40" y="55" font-family="system-ui" font-size="40" fill="#ffffff" text-anchor="middle" font-weight="bold">${currentProfile.initials}</text></svg>`,
                }}
              />
            </View>

            {/* Name, Rating, Location Column (Right) */}
            <ThemedView variant="secondary" className="flex-1 pt-1">
              <ThemedText className="text-xl font-bold text-foreground">
                {displayName}
              </ThemedText>
              <ThemedView
                variant="secondary"
                className="flex-row items-center mt-1 space-x-1"
              >
                <Ionicons name="star" size={14} color={tintColor} />
                <ThemedText className="text-sm text-foreground font-semibold">
                  {currentProfile.rating.toFixed(1)} rating
                </ThemedText>
              </ThemedView>
              <ThemedView
                variant="secondary"
                className="flex-row items-center mt-1 space-x-1"
              >
                <Ionicons name="location" size={12} color={tintColor} />
                {/* Use dynamic location */}
                <ThemedText className="text-xs text-muted-foreground">
                  {currentProfile.location}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
          {/* End of Profile Details Layout */}

          {/* Bio */}
          <ThemedView variant="secondary" className="w-full px-0">
            {/* Use dynamic bio */}
            <ThemedText className="text-base text-muted-foreground mt-4">
              {currentProfile.bio}
            </ThemedText>
          </ThemedView>

          {/* Stats Row */}
          <ThemedView
            variant="secondary"
            className="flex-row justify-between w-full mt-6 mb-4"
          >
            <ThemedView variant="secondary" className="items-center">
              <ThemedText className="text-lg font-bold text-foreground">
                {currentProfile.attended}
              </ThemedText>
              <ThemedText className="text-xs text-muted-foreground">
                Attended
              </ThemedText>
            </ThemedView>
            <ThemedView variant="secondary" className="items-center">
              <ThemedText className="text-lg font-bold text-foreground">
                {currentProfile.created}
              </ThemedText>
              <ThemedText className="text-xs text-muted-foreground">
                Created
              </ThemedText>
            </ThemedView>
            <ThemedView variant="secondary" className="items-center">
              <ThemedText className="text-lg font-bold text-foreground">
                {currentProfile.followers}
              </ThemedText>
              <ThemedText className="text-xs text-muted-foreground">
                Followers
              </ThemedText>
            </ThemedView>
            <ThemedView variant="secondary" className="items-center">
              <ThemedText className="text-lg font-bold text-foreground">
                {currentProfile.following}
              </ThemedText>
              <ThemedText className="text-xs text-muted-foreground">
                Following
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Action Buttons */}
          <ThemedView
            variant="secondary"
            className="flex-row justify-center w-full mt-2 mb-4 space-x-3"
          >
            <ThemedPressable
              variant="primary"
              className="flex-1 p-3 rounded-lg items-center flex-row justify-center mr-1 shadow-md"
              onPress={() => router.push("/profile/edit")}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={THEME[theme].primaryForeground}
              />
              <Text
                style={{ color: THEME[theme].primaryForeground }}
                className="text-base font-semibold ml-2"
              >
                Edit Profile
              </Text>
            </ThemedPressable>
            <ThemedPressable
              variant="popover"
              className="flex-1 p-3 rounded-lg items-center flex-row justify-center ml-1 shadow-md"
              onPress={() => console.log("Share Pressed")}
            >
              <Ionicons
                name="share-outline"
                size={18}
                color={Colors[theme].icon}
              />
              <ThemedText className="text-base font-semibold ml-2 text-muted-foreground">
                Share
              </ThemedText>
            </ThemedPressable>
          </ThemedView>

          {/* Member Since */}
          <ThemedView
            variant="secondary"
            className="flex-row items-center w-full mt-2 space-x-2 border-b border-border pb-4"
          >
            <Ionicons name="calendar-outline" size={18} color={tintColor} />
            <ThemedText className="text-sm text-muted-foreground mx-1">
              Member since {currentProfile.member_since}
            </ThemedText>
          </ThemedView>

          {/* My Reviews Section */}
          <ThemedView variant="secondary" className="w-full mt-4">
            <ThemedView
              variant="secondary"
              className="flex-row items-center justify-between"
            >
              <ThemedText variant="subheader">
                My Reviews ({userReviews.length})
              </ThemedText>
              <ThemedView
                variant="secondary"
                className="flex-row items-center space-x-1"
              >
                <Ionicons name="star" size={18} color="#FFD700" />
                <ThemedText variant="subheader" className="font-bold">
                  {currentProfile.reviewRating.toFixed(1)}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            {/* Map over dynamically fetched reviews */}
            <View className="mt-4 space-y-4">
              {userReviews.length > 0 ? (
                userReviews.map((review) => (
                  <UserReviewCard key={review.id} review={review} />
                ))
              ) : (
                <ThemedText className="text-sm text-muted-foreground text-center p-4">
                  No reviews yet.
                </ThemedText>
              )}
            </View>
          </ThemedView>

          {/* --- SETTINGS / ACTIONS --- */}
          <ThemedView
            variant="background"
            className="w-full mt-8 rounded-xl p-4 shadow-md space-y-10"
          >
            {/* Light/Dark Toggle (Styled as a clean, segmented control) */}
            <ThemedView
              variant="background"
              className="flex-row justify-between items-center mb-8"
            >
              <ThemedText variant="button" className="text-xl">
                Appearance
              </ThemedText>
              <TouchableOpacity
                onPress={handleLightDarkToggle}
                activeOpacity={0.8}
                // Use background utilities directly, with correct dark mode switching
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${
                  theme === "dark"
                    ? "bg-blue-600 justify-end"
                    : "bg-gray-400 justify-start"
                } flex-row items-center`}
              >
                {/* Toggle Circle */}
                <View
                  className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 transform ${
                    theme === "dark" ? "translate-x-0" : "-translate-x-0"
                  }`}
                  // Fallback using flex alignment for toggle switch animation
                />
              </TouchableOpacity>
            </ThemedView>

            {/* Sign Out Button (Styled to fit within the card) */}
            <TouchableOpacity
              className="bg-red-500 p-3 rounded-lg items-center flex-row justify-center"
              onPress={handleSignOutPress}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color="white" />
              <Text className="text-white text-base font-semibold ml-2">
                Sign Out
              </Text>
            </TouchableOpacity>
          </ThemedView>
          {/* --- END SETTINGS / ACTIONS --- */}
        </ThemedView>
      </ScrollView>

      {/* Confirmation Modal */}
      {Platform.OS !== "android" && (
        <ConfirmationModal
          visible={showSignOutModal}
          title="Sign Out"
          message="Are you sure you want to sign out?"
          confirmText="Sign Out"
          cancelText="Cancel"
          confirmStyle="destructive"
          onConfirm={handleSignOutConfirm}
          onCancel={handleSignOutCancel}
        />
      )}
    </>
  );
}
