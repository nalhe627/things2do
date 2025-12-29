import React from "react";
import { View, ViewProps, StyleProp, ViewStyle } from "react-native";
import { useThemeContext } from "@/constants/theme-context";
import { THEME } from "@/constants/theme";

type Variant = keyof (typeof THEME)["light"];

export type ThemedViewProps = ViewProps & {
  variant?: Variant;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function ThemedView({
  variant = "secondary",
  className = "",
  style,
  ...rest
}: ThemedViewProps) {
  const { theme } = useThemeContext();
  const bgColor = THEME[theme][variant];

  // Only apply theme background if className doesn't contain NativeWind bg classes
  const shouldApplyThemeBg = !className?.includes("bg-");

  return (
    <View
      className={className}
      style={[shouldApplyThemeBg && { backgroundColor: bgColor }, style]}
      {...rest}
    />
  );
}
