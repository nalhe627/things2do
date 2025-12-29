import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  useWindowDimensions,
  Dimensions,
  Linking,
  useColorScheme,
  Platform,
  Image as RNImage,
  RefreshControl,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ThemedPressable } from "@/components/themed-pressable";
import { Fonts, Colors, THEME } from "@/constants/theme";
import { useThemeContext } from "@/constants/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapPreview from "@/components/map-preview";
import { supabase } from "@/utils/supabase";
import { fetchLatestPost, fetchPostsExcluding } from "@/api/discovery";
import { LineupItem, ReviewItem } from "@/types/ui-models";
import { saveEvent } from "@/api/save-events";
import { recordViewedEvent, fetchViewedEventIds } from "@/api/viewed-events";
import {
  parseTime,
  formatDateRange,
  formatTimeRange,
  formatAgendaDate,
} from "@/utils/time-parser";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function DiscoveryScreen() {
  const { theme } = useThemeContext();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const accentColor = theme === "dark" ? "#3B82F6" : "#1D4ED8";
  const borderColor =
    theme === "dark" ? "border-neutral-700" : "border-neutral-200";

  // DECK STATE - stack of posts (last = top card)
  const [deck, setDeck] = useState<any[]>([]);
  const [viewedPostIds, setViewedPostIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Gesture animation values for TOP CARD only
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scrollY = useSharedValue(0);

  const scrollRef = useRef<Animated.ScrollView>(null);

  // Load initial deck (3 posts) - exclude already viewed
  const loadDeck = useCallback(async () => {
    setIsLoading(true);
    console.log("🔄 Loading initial deck...");

    // Fetch viewed event IDs from database
    const viewedIds = await fetchViewedEventIds();
    console.log(`📋 User has viewed ${viewedIds.length} events`);

    // Update local state with server data
    setViewedPostIds(new Set(viewedIds));

    const newPosts = await fetchPostsExcluding(viewedIds, 3);
    if (newPosts.length > 0) {
      setDeck((prev) => [...prev, ...newPosts]);
      console.log(`✅ Loaded ${newPosts.length} posts into deck`);
    }
    setIsLoading(false);
  }, []);

  // Preload more if deck low (<3) - exclude already viewed
  const preloadIfNeeded = useCallback(async () => {
    if (deck.length < 3 && !isLoading) {
      console.log("📥 Preloading more posts...");
      const viewedIds = Array.from(viewedPostIds);
      const morePosts = await fetchPostsExcluding(viewedIds, 3 - deck.length);
      if (morePosts.length > 0) {
        setDeck((prev) => [...prev, ...morePosts]);
        console.log(`✅ Preloaded ${morePosts.length} more posts`);
      }
    }
  }, [deck.length, isLoading, viewedPostIds]);

  // Initial load
  useEffect(() => {
    loadDeck();
  }, []);

  // Top card (interactive) & next card (peeking)
  const topPost = deck[deck.length - 1];
  const nextPost = deck[deck.length - 2];

  // Handle swipe commit - now records to database
  const handleSwipe = useCallback(
    async (action: "pass" | "like") => {
      if (!topPost?.id) return;

      if (action === "like") {
        console.log("💚 Saving event...");

        // Save the event
        const { error: saveError } = await saveEvent(topPost.id);
        if (saveError) {
          console.error("Failed to save event:", saveError);
        } else {
          console.log("✅ Event saved successfully!");
        }

        // Record as viewed with 'saved' action
        const { error: viewError } = await recordViewedEvent(
          topPost.id,
          "saved"
        );
        if (viewError) {
          console.error("Failed to record viewed event:", viewError);
        }
      } else {
        console.log("👎 Passed!");

        // Record as viewed with 'passed' action
        const { error: viewError } = await recordViewedEvent(
          topPost.id,
          "passed"
        );
        if (viewError) {
          console.error("Failed to record viewed event:", viewError);
        }
      }

      // Add to local viewed set
      setViewedPostIds((prev) => new Set([...prev, topPost.id]));

      // Remove from deck (after animation delay)
      setTimeout(() => {
        setDeck((prev) => prev.slice(0, -1));
        // Reset animations for new top card
        translateX.value = 0;
        translateY.value = 0;
        rotate.value = 0;
        opacity.value = 1;
        scale.value = 1;
        setCurrentImageIndex(0);
        preloadIfNeeded();
      }, 200);
    },
    [topPost, preloadIfNeeded]
  );

  // Pan gesture - only on image when not expanded
  const panGesture = Gesture.Pan()
    .maxPointers(1)
    .activeOffsetX([-10, 10]) // Only activate pan after 10px horizontal movement
    .failOffsetY([-20, 20]) // Fail if vertical movement exceeds 20px
    .enabled(!isCardExpanded) // Disable when expanded
    .onStart(() => {
      scale.value = withTiming(1.02, { duration: 100 });
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.1;
      rotate.value = interpolate(
        translateX.value,
        [-width / 2, 0, width / 2],
        [-15, 0, 15],
        Extrapolate.CLAMP
      );
      opacity.value = interpolate(
        Math.abs(event.translationX),
        [0, width / 2],
        [1, 0.7],
        Extrapolate.CLAMP
      );
      scale.value = interpolate(
        Math.abs(event.translationX),
        [0, width / 2],
        [1, 0.95],
        Extrapolate.CLAMP
      );
    })
    .onEnd((event) => {
      const { translationX: x, velocityX: vx } = event;
      const threshold = width / 4;
      const vThreshold = 800;

      const isLeftSwipe = x < -threshold || vx < -vThreshold;
      const isRightSwipe = x > threshold || vx > vThreshold;

      if (isLeftSwipe || isRightSwipe) {
        const dir = isLeftSwipe ? -1 : 1;
        const flyX = dir * width * 1.5;

        translateX.value = withSpring(flyX, {
          velocity: vx,
          damping: 50,
          stiffness: 300,
        });
        rotate.value = withSpring(dir * 30, { damping: 50 });
        opacity.value = withTiming(0, { duration: 150 });
        scale.value = withTiming(0.8, { duration: 150 });

        runOnJS(handleSwipe)(isLeftSwipe ? "pass" : "like");
      } else {
        translateX.value = withSpring(0, { stiffness: 400, damping: 25 });
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
        opacity.value = withTiming(1, { duration: 100 });
        scale.value = withSpring(1);
      }
    });

  // Scroll handler for vertical scrolling (inside card)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      // Auto-expand when scrolled down
      if (event.contentOffset.y > 50 && !isCardExpanded) {
        runOnJS(setIsCardExpanded)(true);
      }
    },
  });

  // Tap zones for image navigation (10% left/right)
  const handleImageTap = useCallback(
    (event: any) => {
      const tapX = event.nativeEvent.locationX;
      const imageWidth = width;
      const leftZone = imageWidth * 0.1;
      const rightZone = imageWidth * 0.9;

      if (tapX < leftZone) {
        // Left 10% - previous image
        prevImage();
      } else if (tapX > rightZone) {
        // Right 10% - next image
        nextImage();
      } else {
        // Center - expand card
        setIsCardExpanded(true);
      }
    },
    [width]
  );

  // Modified tap gesture for center area only
  const tapGesture = Gesture.Tap().onEnd((event) => {
    const tapX = event.x;
    const imageWidth = width;
    const leftZone = imageWidth * 0.1;
    const rightZone = imageWidth * 0.9;

    // Only expand if tapping center area
    if (tapX >= leftZone && tapX <= rightZone) {
      runOnJS(setIsCardExpanded)(true);
    }
  });

  // Combined gestures
  const composedGesture = Gesture.Race(panGesture, tapGesture);

  // Animated styles
  const topCardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  const nextCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: 0.95 }, { translateY: 10 }],
      opacity: 0.5,
    };
  });

  // Overlay styles
  const saveOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: Math.max(0, Math.min(0.8, translateX.value / 150)),
    };
  });

  const passOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: Math.max(0, Math.min(0.8, -translateX.value / 150)),
    };
  });

  // Helper: Map post data to event structure
  const mapPostToEvent = (post: any) => {
    console.log("🔍 Discovery - Raw post data:", {
      title: post.title,
      start_date: post.start_date,
      end_date: post.end_date,
      start_time: post.start_time,
      end_time: post.end_time,
      is_multi_day: post.is_multi_day,
      image_urls: post.image_urls,
    });

    // Use shared utilities
    const dateDisplay = formatDateRange(
      post.start_date,
      post.end_date,
      post.is_multi_day
    );
    const timeDisplay =
      formatTimeRange(post.start_time, post.end_time) || "Time TBD";

    const mappedEvent = {
      id: post.id,
      title: post.title || "Untitled Event",
      images:
        Array.isArray(post.image_urls) && post.image_urls.length
          ? post.image_urls
          : [],
      tags: Array.isArray(post.tags) && post.tags.length ? post.tags : [],
      date: dateDisplay,
      time: timeDisplay,
      isMultiDay: post.is_multi_day || false,
      priceRange:
        typeof post.cost === "number" ? `$${post.cost.toFixed(2)}` : "Free",
      description: post.short_description || "No description available.",
      fullDescription: post.description || "No description available.",
      location: post.location
        ? {
            name: post.location.name || "Unknown Location",
            address: post.location.address || "",
            coordinates: {
              latitude: Number(post.location.latitude) || 0,
              longitude: Number(post.location.longitude) || 0,
            },
          }
        : {
            name: "Unknown Location",
            address: "",
            coordinates: { latitude: 0, longitude: 0 },
          },
      lineup:
        post.agenda_items && post.agenda_items.length
          ? post.agenda_items.map((item: Record<string, any>) => ({
              time: formatTimeRange(item.start_time, item.end_time) || "TBD",
              date: formatAgendaDate(item.scheduled_date),
              artist: item.title,
              stage: item.item_type || "",
              isHeadliner: item.item_type === "headliner",
            }))
          : [],
      rating: 4.8,
      interestedCount: 0,
      attendingCount: 0,
      organizer: {
        name: "Unknown Organizer",
        rating: 0,
        verified: false,
        description: "",
      },
      reviews: [],
      howToFindUs:
        post.how_to_find_us ||
        "No directions provided. Please contact the organizer for details.",
      refundPolicy:
        post.refund_policy ||
        (post.refund_policy_link
          ? `View refund policy: ${post.refund_policy_link}`
          : "No refund policy specified. Please contact the organizer for details."),
      registrationInfo: post.ticket_link
        ? `Register at: ${post.ticket_link}`
        : "Details not available.",
    };

    console.log("✅ Discovery - Mapped event:", {
      date: mappedEvent.date,
      time: mappedEvent.time,
      isMultiDay: mappedEvent.isMultiDay,
      lineupCount: mappedEvent.lineup.length,
    });

    return mappedEvent;
  };

  // Helper functions
  const nextImage = () => {
    if (topEvent && topEvent.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % topEvent.images.length);
    }
  };

  const prevImage = () => {
    if (topEvent && topEvent.images.length > 0) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + topEvent.images.length) % topEvent.images.length
      );
    }
  };

  const handleGetDirections = () => {
    if (topEvent) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${topEvent.location.coordinates.latitude},${topEvent.location.coordinates.longitude}`;
      Linking.openURL(url);
    }
  };

  const handleGetTickets = () => {
    console.log("Get tickets pressed!");
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={`full-${i}`} name="star" size={14} color="#FBBF24" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons
          key="half"
          name="star-half-outline"
          size={14}
          color="#FBBF24"
        />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons
          key={`empty-${i}`}
          name="star-outline"
          size={14}
          color="#FBBF24"
        />
      );
    }

    return <View className="flex-row gap-0.5">{stars}</View>;
  };

  // Color constants
  const dividerBgColor = theme === "dark" ? "#374151" : "#E5E7EB";
  const neutralTextColor = theme === "dark" ? "#9CA3AF" : "#6B7280";
  const mutedTextColor = theme === "dark" ? "#9CA3AF" : "#6B7280";
  const headerTextColor = theme === "dark" ? "#F9FAFB" : "#111827";
  const smallTextColor = theme === "dark" ? "#9CA3AF" : "#6B7280";

  // Calculate available height for card
  const TAB_BAR_HEIGHT = 50; // Standard tab bar height
  const cardHeight = height - insets.top - insets.bottom - TAB_BAR_HEIGHT - 20; // 20px for padding

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log("🔄 Refreshing discovery deck...");

    try {
      // Clear current deck and reload
      setDeck([]);
      setCurrentImageIndex(0);
      setIsCardExpanded(false);

      // Fetch viewed event IDs from database
      const viewedIds = await fetchViewedEventIds();
      console.log(`📋 User has viewed ${viewedIds.length} events`);

      // Update local state with server data
      setViewedPostIds(new Set(viewedIds));

      // Fetch fresh posts
      const newPosts = await fetchPostsExcluding(viewedIds, 3);
      if (newPosts.length > 0) {
        setDeck(newPosts);
        console.log(`✅ Refreshed with ${newPosts.length} new posts`);
      } else {
        console.log("ℹ️ No new posts available");
      }
    } catch (error) {
      console.error("❌ Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  if (isLoading && deck.length === 0) {
    return (
      <ThemedView
        variant="background"
        className="flex-1 items-center justify-center"
      >
        <ThemedText variant="header">Loading events...</ThemedText>
      </ThemedView>
    );
  }

  if (deck.length === 0) {
    return (
      <ThemedView
        variant="background"
        className="flex-1 items-center justify-center p-8"
      >
        <Ionicons name="sad-outline" size={64} color="#9CA3AF" />
        <ThemedText variant="header" className="text-center mt-4">
          No More Events
        </ThemedText>
        <ThemedText variant="normal" className="text-center mt-2">
          You&apos;ve seen all available events! Check back later.
        </ThemedText>
      </ThemedView>
    );
  }

  const topEvent = topPost ? mapPostToEvent(topPost) : null;

  return (
    <GestureHandlerRootView className="flex-1">
      <ThemedView variant="background" className="flex-1">
        {/* Stack container */}
        <View
          className="flex-1 items-center"
          style={{
            paddingBottom: 10,
            paddingHorizontal: Platform.OS === "web" ? 8 : 0,
            justifyContent: Platform.OS === "web" ? "center" : "flex-start",
          }}
        >
          {/* Next card (peeking behind) */}
          {nextPost && (
            <Animated.View
              style={[
                nextCardStyle,
                {
                  position: "absolute",
                  width: Platform.OS === "web" ? "95%" : "100%",
                  height: cardHeight,
                  borderRadius: Platform.OS === "web" ? 16 : 0,
                  backgroundColor: THEME[theme].secondary,
                  borderWidth: Platform.OS === "web" ? 1 : 0,
                  borderColor: theme === "dark" ? "#374151" : "#E5E7EB",
                  top: Platform.OS === "web" ? undefined : 0,
                },
              ]}
            />
          )}

          {/* Top card (interactive) */}
          {topEvent && (
            <GestureDetector gesture={composedGesture}>
              <Animated.View
                style={[
                  {
                    width: Platform.OS === "web" ? "95%" : "100%",
                    height: cardHeight,
                    backgroundColor: "#000000",
                    borderRadius: Platform.OS === "web" ? 16 : 0,
                    overflow: "hidden",
                    borderWidth: Platform.OS === "web" ? 1 : 0,
                    borderColor: theme === "dark" ? "#374151" : "#E5E7EB",
                  },
                  topCardStyle,
                ]}
              >
                {/* SAVE/PASS Overlays */}
                <Animated.View
                  style={[saveOverlayStyle]}
                  className="absolute top-16 left-8 z-[100] border-2 border-emerald-500 bg-emerald-500/20 rounded-lg px-3 py-1.5 -rotate-12"
                  pointerEvents="none"
                >
                  <Text className="text-emerald-600 dark:text-emerald-400 text-lg font-semibold tracking-wide">
                    SAVE
                  </Text>
                </Animated.View>

                <Animated.View
                  style={[passOverlayStyle]}
                  className="absolute top-16 right-8 z-[100] border-2 border-red-500 bg-red-500/20 rounded-lg px-3 py-1.5 rotate-12"
                  pointerEvents="none"
                >
                  <Text className="text-red-600 dark:text-red-400 text-lg font-semibold tracking-wide">
                    PASS
                  </Text>
                </Animated.View>

                {/* Card content */}
                {!isCardExpanded ? (
                  // COLLAPSED VIEW - Tinder-style
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  >
                    {/* Full-screen image with tap zones */}
                    <ThemedPressable
                      onPress={(e) => {
                        const tapX = e.nativeEvent.locationX || 0;
                        const imageWidth = width;
                        const leftZone = imageWidth * 0.1;
                        const rightZone = imageWidth * 0.9;

                        if (tapX < leftZone && topEvent.images.length > 1) {
                          prevImage();
                        } else if (
                          tapX > rightZone &&
                          topEvent.images.length > 1
                        ) {
                          nextImage();
                        } else {
                          setIsCardExpanded(true);
                        }
                      }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                      }}
                    >
                      <RNImage
                        source={{
                          uri:
                            topEvent.images[currentImageIndex] ||
                            "https://placehold.co/400x600/cccccc/000000?text=No+Image",
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                        }}
                        resizeMode="cover"
                      />
                    </ThemedPressable>

                    {/* Image indicators (dots) */}
                    {topEvent.images.length > 1 && (
                      <View
                        style={{
                          position: "absolute",
                          top: 16,
                          left: 0,
                          right: 0,
                          flexDirection: "row",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        {topEvent.images.map((_: any, idx: number) => (
                          <View
                            key={idx}
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor:
                                idx === currentImageIndex
                                  ? "#FFFFFF"
                                  : "rgba(255,255,255,0.4)",
                            }}
                          />
                        ))}
                      </View>
                    )}

                    {/* Bottom gradient overlay with info */}
                    <LinearGradient
                      colors={[
                        "transparent",
                        "rgba(0,0,0,0.3)",
                        "rgba(0,0,0,0.7)",
                        "rgba(0,0,0,0.95)",
                      ]}
                      locations={[0, 0.3, 0.6, 1]}
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        paddingBottom: insets.bottom + 20,
                        paddingTop: 100,
                        paddingHorizontal: 20,
                      }}
                      pointerEvents="none"
                    >
                      {/* Event Name */}
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: Math.min(32, width * 0.08),
                          fontWeight: "bold",
                          marginBottom: 8,
                          flexWrap: "wrap",
                        }}
                        numberOfLines={2}
                      >
                        {topEvent.title}
                      </Text>

                      {/* Short Description - White text */}
                      {topEvent.description && (
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 14,
                            marginBottom: 12,
                            lineHeight: 20,
                            opacity: 0.9,
                            flexWrap: "wrap",
                          }}
                          numberOfLines={3}
                        >
                          {topEvent.description}
                        </Text>
                      )}

                      {/* Date & Time - Tinder-style rounded boxes */}
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          gap: 8,
                          marginBottom: 12,
                          maxWidth: width - 40,
                        }}
                      >
                        {/* Date Box */}
                        <View
                          style={{
                            backgroundColor: "rgba(255,255,255,0.2)",
                            borderRadius: 20,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.3)",
                            maxWidth: width * 0.8,
                          }}
                        >
                          <Ionicons
                            name="calendar-outline"
                            size={16}
                            color="#FFFFFF"
                          />
                          <Text
                            style={{
                              color: "#FFFFFF",
                              fontSize: 13,
                              fontWeight: "600",
                              flexShrink: 1,
                            }}
                            numberOfLines={1}
                          >
                            {topEvent.date}
                          </Text>
                        </View>

                        {/* Time Box */}
                        {topEvent.time && (
                          <View
                            style={{
                              backgroundColor: "rgba(255,255,255,0.2)",
                              borderRadius: 20,
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                              borderWidth: 1,
                              borderColor: "rgba(255,255,255,0.3)",
                              maxWidth: width * 0.8,
                            }}
                          >
                            <Ionicons
                              name="time-outline"
                              size={16}
                              color="#FFFFFF"
                            />
                            <Text
                              style={{
                                color: "#FFFFFF",
                                fontSize: 13,
                                fontWeight: "600",
                                flexShrink: 1,
                              }}
                              numberOfLines={1}
                            >
                              {topEvent.time}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Tap to expand hint */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          marginTop: 12,
                          paddingVertical: 8,
                          paddingHorizontal: 14,
                          backgroundColor: "rgba(255,255,255,0.2)",
                          borderRadius: 20,
                          alignSelf: "center",
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.3)",
                          maxWidth: width - 60,
                        }}
                      >
                        <Ionicons name="chevron-up" size={14} color="#FFFFFF" />
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 13,
                            fontWeight: "500",
                            flexShrink: 1,
                          }}
                          numberOfLines={1}
                        >
                          Tap for more details
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                ) : (
                  // EXPANDED VIEW - Full scrollable details
                  <View style={{ flex: 1 }}>
                    {/* Close button */}
                    <ThemedPressable
                      onPress={() => {
                        setIsCardExpanded(false);
                        scrollRef.current?.scrollTo({ y: 0, animated: true });
                      }}
                      className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full items-center justify-center bg-black/50"
                    >
                      <Ionicons name="close" size={24} color="#FFFFFF" />
                    </ThemedPressable>

                    <Animated.ScrollView
                      ref={scrollRef}
                      onScroll={scrollHandler}
                      scrollEventThrottle={16}
                      showsVerticalScrollIndicator={false}
                      className="flex-1"
                      bounces={true}
                      scrollEnabled={true}
                      refreshControl={
                        Platform.OS !== "web" ? (
                          <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#3B82F6"
                            colors={["#3B82F6"]}
                            title="Pull to refresh"
                            titleColor={
                              theme === "dark" ? "#9CA3AF" : "#6B7280"
                            }
                          />
                        ) : undefined
                      }
                    >
                      {/* Image Section */}
                      <ThemedView
                        variant="background"
                        className="w-full relative"
                        style={{ height: height * 0.5 }}
                      >
                        <RNImage
                          source={{
                            uri:
                              topEvent.images[currentImageIndex] ||
                              "https://placehold.co/400x600/cccccc/000000?text=No+Image",
                          }}
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                          resizeMode="cover"
                        />

                        {/* Image Navigation */}
                        {topEvent.images.length > 1 && (
                          <>
                            <ThemedPressable
                              variant="muted"
                              onPress={prevImage}
                              className="absolute left-3 top-1/2 w-8 h-8 rounded-full items-center justify-center bg-black/50"
                            >
                              <Ionicons
                                name="chevron-back"
                                size={18}
                                color="#FFFFFF"
                              />
                            </ThemedPressable>
                            <ThemedPressable
                              variant="muted"
                              onPress={nextImage}
                              className="absolute right-3 top-1/2 w-8 h-8 rounded-full items-center justify-center bg-black/50"
                            >
                              <Ionicons
                                name="chevron-forward"
                                size={18}
                                color="#FFFFFF"
                              />
                            </ThemedPressable>
                          </>
                        )}

                        {/* Rating Badge */}
                        <View className="absolute top-4 left-4">
                          <View className="flex-row items-center bg-black/60 px-3 py-2 rounded-xl gap-1">
                            <Ionicons name="star" size={14} color="#FBBF24" />
                            <Text className="text-white text-sm font-semibold">
                              {topEvent.rating}
                            </Text>
                          </View>
                        </View>
                      </ThemedView>

                      {/* Event Details */}
                      <ThemedView variant="secondary" className="p-5">
                        <ThemedText
                          variant="header"
                          className="text-2xl mb-2 leading-tight"
                        >
                          {topEvent.title}
                        </ThemedText>

                        {/* Date & Location */}
                        <View className="flex-row gap-3 mb-4">
                          {(topEvent.date ||
                            (topEvent.time &&
                              topEvent.time !== "Time TBD")) && (
                            <ThemedView
                              variant="muted"
                              className="flex-1 p-3.5 rounded-xl"
                            >
                              <View className="flex-row gap-2 mb-1.5">
                                <Ionicons
                                  name="calendar-outline"
                                  size={16}
                                  color={accentColor}
                                />
                                <Text
                                  style={{ color: mutedTextColor }}
                                  className="text-xs font-semibold uppercase"
                                >
                                  Date & Time
                                </Text>
                              </View>
                              {topEvent.date && (
                                <Text
                                  style={{ color: headerTextColor }}
                                  className="text-base font-semibold"
                                >
                                  {topEvent.date}
                                </Text>
                              )}
                              {topEvent.time &&
                                topEvent.time !== "Time TBD" && (
                                  <View className="flex-row items-center gap-1 mt-1">
                                    <Ionicons
                                      name="time-outline"
                                      size={14}
                                      color={accentColor}
                                    />
                                    <Text
                                      style={{ color: neutralTextColor }}
                                      className="text-sm"
                                    >
                                      {topEvent.time}
                                    </Text>
                                  </View>
                                )}
                            </ThemedView>
                          )}

                          <ThemedView
                            variant="muted"
                            className="flex-1 p-3.5 rounded-xl"
                          >
                            <View className="flex-row gap-2 mb-1.5">
                              <Ionicons
                                name="location-outline"
                                size={16}
                                color={accentColor}
                              />
                              <Text
                                style={{ color: mutedTextColor }}
                                className="text-xs font-semibold uppercase"
                              >
                                Location
                              </Text>
                            </View>
                            <Text
                              style={{ color: headerTextColor }}
                              className="text-base font-semibold"
                            >
                              {topEvent.location.name}
                            </Text>
                          </ThemedView>
                        </View>

                        {/* Tags */}
                        {topEvent.tags.length > 0 && (
                          <View className="flex-row flex-wrap gap-2 mb-4">
                            {topEvent.tags.map((tag: string, idx: number) => (
                              <ThemedView
                                key={idx}
                                variant="muted"
                                className="px-3 py-1.5 rounded-full"
                              >
                                <ThemedText
                                  variant="normal"
                                  className="text-xs font-semibold"
                                >
                                  {tag}
                                </ThemedText>
                              </ThemedView>
                            ))}
                          </View>
                        )}

                        {/* Description */}
                        <ThemedText
                          variant="normal"
                          className="text-base leading-relaxed"
                        >
                          {topEvent.description}
                        </ThemedText>
                      </ThemedView>

                      {/* Divider */}
                      <View
                        className="h-px mx-5"
                        style={{ backgroundColor: dividerBgColor }}
                      />

                      {/* About This Event */}
                      <ThemedView variant="secondary" className="p-5">
                        <ThemedText variant="subheader" className="mb-3">
                          About This Event
                        </ThemedText>
                        <ThemedText
                          variant="normal"
                          className="text-base leading-6"
                        >
                          {topEvent.fullDescription}
                        </ThemedText>
                      </ThemedView>

                      {/* Divider */}
                      <View
                        className="h-px my-0 mx-5"
                        style={{ backgroundColor: dividerBgColor }}
                      />

                      {/* Lineup & Schedule - Enhanced with dates and end times */}
                      {topEvent.lineup && topEvent.lineup.length > 0 && (
                        <ThemedView variant="secondary" className="p-5">
                          <ThemedText variant="subheader" className="mb-4">
                            Lineup & Schedule
                          </ThemedText>
                          <View className="gap-3">
                            {topEvent.lineup.map(
                              (item: LineupItem, idx: number) => (
                                <View
                                  key={idx}
                                  className={
                                    item.isHeadliner
                                      ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50 rounded-xl p-4"
                                      : "p-4 bg-neutral-50 dark:bg-neutral-700/30 rounded-lg"
                                  }
                                >
                                  <View className="flex-row items-center justify-between mb-2">
                                    <View className="flex-1">
                                      {item.date && (
                                        <Text
                                          style={{ color: neutralTextColor }}
                                          className="text-xs font-semibold uppercase mb-1"
                                        >
                                          {item.date}
                                        </Text>
                                      )}
                                      <Text
                                        style={{ color: neutralTextColor }}
                                        className="text-sm font-semibold"
                                      >
                                        {item.time}
                                      </Text>
                                    </View>
                                    {item.isHeadliner && (
                                      <View className="px-2 py-1 bg-amber-500 rounded-full">
                                        <Text className="text-white text-xs font-semibold">
                                          Headliner
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                  <View className="flex-row items-center">
                                    <Text
                                      style={{ color: headerTextColor }}
                                      className="flex-1 text-base font-bold"
                                    >
                                      {item.artist}
                                    </Text>
                                    {item.stage && (
                                      <Text
                                        style={{ color: neutralTextColor }}
                                        className="text-sm font-medium"
                                      >
                                        {item.stage}
                                      </Text>
                                    )}
                                  </View>
                                </View>
                              )
                            )}
                          </View>
                        </ThemedView>
                      )}

                      {/* Divider */}
                      <View
                        className="h-px my-0 mx-5"
                        style={{ backgroundColor: dividerBgColor }}
                      />

                      {/* Location Section - With map, matching screenshot */}
                      <ThemedView variant="secondary" className="p-5">
                        <ThemedText variant="subheader" className="mb-4">
                          Location
                        </ThemedText>
                        <View className="rounded-xl overflow-hidden mb-4 shadow-sm">
                          <MapPreview
                            latitude={topEvent.location.coordinates.latitude}
                            longitude={topEvent.location.coordinates.longitude}
                            height={180}
                            accentColor={accentColor}
                          />
                        </View>
                        <ThemedView
                          variant="muted"
                          className="flex-row gap-3 p-4 bg-neutral-50 dark:bg-neutral-700/30 rounded-xl mb-3"
                        >
                          <Ionicons
                            name="location-outline"
                            size={18}
                            color={accentColor}
                          />
                          <View className="flex-1">
                            <Text
                              style={{ color: headerTextColor }}
                              className="text-base font-semibold mb-1"
                            >
                              {topEvent.location.name}
                            </Text>
                            <Text
                              style={{ color: smallTextColor }}
                              className="text-sm"
                            >
                              {topEvent.location.address}
                            </Text>
                          </View>
                        </ThemedView>
                        <ThemedPressable
                          variant="muted"
                          onPress={handleGetDirections}
                          className="w-full flex-row items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-neutral-50 dark:bg-neutral-700/30"
                        >
                          <Ionicons
                            name="navigate-outline"
                            size={18}
                            color={accentColor}
                          />
                          <Text
                            className="text-base font-semibold"
                            style={{ color: accentColor }}
                          >
                            Get Directions
                          </Text>
                        </ThemedPressable>
                      </ThemedView>

                      {/* Divider */}
                      <View
                        className="h-px my-0 mx-5"
                        style={{ backgroundColor: dividerBgColor }}
                      />

                      {/* How to Find Us */}
                      <ThemedView variant="secondary" className="p-5">
                        <ThemedText variant="subheader" className="mb-3">
                          How to Find Us
                        </ThemedText>
                        <ThemedText
                          variant="normal"
                          className="text-base leading-6 font-normal"
                        >
                          {topEvent.howToFindUs}
                        </ThemedText>
                      </ThemedView>

                      {/* Divider */}
                      <View
                        className="h-px my-0 mx-5"
                        style={{ backgroundColor: dividerBgColor }}
                      />

                      {/* Reviews - Matching screenshot layout */}
                      {topEvent.reviews && topEvent.reviews.length > 0 && (
                        <ThemedView variant="secondary" className="p-5">
                          <View className="flex-row justify-between items-center mb-4">
                            <ThemedText variant="subheader">Reviews</ThemedText>
                            <View className="flex-row items-center gap-1">
                              <Ionicons name="star" size={16} color="#FBBF24" />
                              <Text
                                style={{ color: headerTextColor }}
                                className="text-lg font-bold"
                              >
                                {topEvent.rating} / 5
                              </Text>
                            </View>
                          </View>

                          <View className="gap-3 mb-4">
                            {topEvent.reviews.map((review: ReviewItem) => (
                              <ThemedView
                                key={review.id}
                                variant="muted"
                                className="p-4 bg-neutral-50 dark:bg-neutral-700/30 rounded-xl"
                              >
                                <View className="flex-row gap-3">
                                  <View className="w-10 h-10 rounded-full overflow-hidden">
                                    <RNImage
                                      source={{ uri: review.avatar }}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                      }}
                                      resizeMode="cover"
                                    />
                                  </View>
                                  <View className="flex-1">
                                    <View className="flex-row justify-between items-start mb-2">
                                      <Text
                                        style={{ color: headerTextColor }}
                                        className="text-sm font-bold"
                                      >
                                        {review.author}
                                      </Text>
                                      <Text
                                        style={{ color: smallTextColor }}
                                        className="text-xs"
                                      >
                                        {review.date}
                                      </Text>
                                    </View>
                                    <View className="mb-2">
                                      {renderStars(review.rating)}
                                    </View>
                                    <Text
                                      style={{ color: smallTextColor }}
                                      className="text-sm leading-relaxed"
                                    >
                                      {review.comment}
                                    </Text>
                                  </View>
                                </View>
                              </ThemedView>
                            ))}
                          </View>

                          <ThemedPressable
                            variant="muted"
                            onPress={() => {}}
                            className="w-full py-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-700/30 items-center"
                          >
                            <ThemedText
                              variant="normal"
                              className="text-base font-semibold"
                            >
                              View All Reviews
                            </ThemedText>
                          </ThemedPressable>
                        </ThemedView>
                      )}

                      {/* Registration - Integrated with policy */}
                      <ThemedView variant="secondary" className="p-5 pb-20">
                        <ThemedText variant="subheader" className="mb-3">
                          Registration
                        </ThemedText>
                        <Text
                          style={{ color: smallTextColor }}
                          className="text-sm leading-relaxed"
                        >
                          {topEvent.registrationInfo}
                        </Text>
                      </ThemedView>
                    </Animated.ScrollView>
                  </View>
                )}
              </Animated.View>
            </GestureDetector>
          )}
        </View>
      </ThemedView>
    </GestureHandlerRootView>
  );
}
