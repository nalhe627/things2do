import React from "react";
import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import { useThemeContext } from "@/constants/theme-context";
import { THEME } from "@/constants/theme";

type Variant = keyof (typeof THEME)["light"];

export type ThemedPressableProps = PressableProps & {
  variant?: Variant;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function ThemedPressable({
  variant = "secondary",
  className = "",
  style,
  ...rest
}: ThemedPressableProps) {
  const { theme } = useThemeContext();
  const bgColor = THEME[theme][variant];

  // Only apply theme background if className doesn't contain NativeWind bg classes
  const shouldApplyThemeBg = !className?.includes("bg-");

  return (
    <Pressable
      className={className}
      style={[shouldApplyThemeBg && { backgroundColor: bgColor }, style]}
      {...rest}
    />
  );
}
