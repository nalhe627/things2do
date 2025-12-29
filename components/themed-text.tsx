import React from "react";
import { Text, TextProps, TextStyle } from "react-native";
import { useThemeContext } from "@/constants/theme-context";
import { TEXT_THEME } from "@/constants/theme";

type Variant = keyof (typeof TEXT_THEME)["light"];

export type ThemedTextProps = TextProps & {
  variant?: Variant;
  style?: TextStyle | TextStyle[];
};

export function ThemedText({
  variant = "header",
  className = "",
  ...rest
}: ThemedTextProps & { className?: string }) {
  const { theme } = useThemeContext();
  const variantClass = TEXT_THEME[theme]?.[variant] ?? "";

  return <Text className={`${variantClass} ${className}`} {...rest} />;
}
