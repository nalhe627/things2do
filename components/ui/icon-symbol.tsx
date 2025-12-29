import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";
import { useThemeContext } from "@/constants/theme-context";
import { ICONS, IconSymbolName } from "@/constants/icons";
import clsx from "clsx";

type IconSymbolProps = {
  name: IconSymbolName;
  size?: number;
  className?: string;
  style?: StyleProp<ImageStyle>;
};

export function IconSymbol({
  name,
  size = 24,
  className = "",
  style,
}: IconSymbolProps) {
  const { theme } = useThemeContext();
  const source = ICONS[name]?.[theme];

  if (!source) {
    console.warn(`Missing icon for name: "${name}" with theme: "${theme}"`);
    return null;
  }

  return (
    <Image
      source={source}
      style={[{ width: size, height: size }, style]}
      className={clsx(className)}
      resizeMode="contain"
    />
  );
}
