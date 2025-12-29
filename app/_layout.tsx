import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/context/auth";
import { PortalHost } from "@rn-primitives/portal";
import { Theme, ThemeContext } from "@/constants/theme-context";
import { ThemedView } from "@/components/themed-view";
import { useState } from "react";

import "react-native-reanimated";
import "@/global.css";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const [theme, setTheme] = useState<Theme>("light");

  return (
    <AuthProvider>
      <ThemeContext.Provider value={{ setTheme, theme }}>
        <ThemedView className="flex-1">
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
          </Stack>

          <StatusBar style={theme === "dark" ? "light" : "dark"} />
          <PortalHost name="global-host" />
        </ThemedView>
      </ThemeContext.Provider>
    </AuthProvider>
  );
}
