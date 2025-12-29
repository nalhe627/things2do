import { Tabs, useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { Colors, THEME } from "@/constants/theme";
import { useThemeContext } from "@/constants/theme-context";
import { ThemedView } from "@/components/themed-view";
import { ThemedPressable } from "@/components/themed-pressable";
import { FAQModal } from "@/components/faq-modal";
import { Portal } from "@rn-primitives/portal";
import "@/global.css";

export default function TabLayout() {
  const { theme } = useThemeContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [faqVisible, setFaqVisible] = useState(false);

  const HeaderRight = () => (
    <ThemedView
      variant="background"
      className=" rounded-lg flex-row gap-2 mr-3 mb-2"
    >
      <ThemedPressable
        variant="muted"
        className="items-center justify-center w-8 h-8 rounded-md"
        onPress={() => setFaqVisible(true)}
      >
        <Ionicons name="help-circle" size={20} color={Colors[theme].text} />
      </ThemedPressable>

      <ThemedPressable
        variant="muted"
        className="items-center justify-center w-8 h-8 rounded-md"
        onPress={() => {
          router.push("/(tabs)/profile");
        }}
      >
        <Ionicons name="person" size={16} color={Colors[theme].text} />
      </ThemedPressable>
    </ThemedView>
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: THEME[theme].background,
        // Desktop: center with max width
        alignSelf: Platform.OS === "web" ? "center" : undefined,
        maxWidth: Platform.OS === "web" ? 1200 : undefined,
        width: "100%",
      }}
    >
      {/* Render modal through portal */}
      <Portal name="faq" hostName="global-host">
        {faqVisible && <FAQModal onClose={() => setFaqVisible(false)} />}
      </Portal>

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[theme].tint,
          tabBarInactiveTintColor: Colors[theme].tabIconDefault,
          tabBarStyle: {
            backgroundColor: THEME[theme].background,
            borderTopColor: THEME[theme].border,
            borderTopWidth: 1,
          },
          headerShown: true,
          tabBarButton: HapticTab,
          tabBarHideOnKeyboard: true,
          headerRight: () => <HeaderRight />,
          headerStyle: {
            height: 60 + insets.top,
            backgroundColor: THEME[theme].background,
            borderBottomColor: THEME[theme].border,
            borderBottomWidth: 1,
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
            color: THEME[theme].foreground,
          },
        }}
      >
        <Tabs.Screen
          name="create-post"
          options={{
            title: "Create Post",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle" size={size ?? 26} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="user-listings"
          options={{
            title: "Dasboard",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" size={size ?? 26} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="discovery"
          options={{
            title: "Discovery",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="compass" size={size ?? 26} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="thing-deck"
          options={{
            title: "Deck",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bookmarks" size={size ?? 26} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size ?? 26} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="edit-post"
          options={{
            href: null, // Hide from tab bar
            title: "Edit Post",
          }}
        />
      </Tabs>
    </View>
  );
}
