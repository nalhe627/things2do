import React from "react";
import { TextInput, TextInputProps, StyleProp, TextStyle } from "react-native";
import { useThemeContext } from "@/constants/theme-context";
import { INPUT_THEME, TEXT_THEME } from "@/constants/theme";
import clsx from "clsx";

/**
 * A themed text input component that adapts its styles based on the current theme.
 * Allows specifying a variant for background and text styles.
 * Allows specifying a text variant for text styles.
 *  
*/

type BgVariant = keyof (typeof INPUT_THEME)["light"];
type TextVariant = keyof (typeof TEXT_THEME)["light"];

export type ThemedTextInputProps = TextInputProps & {
  variant?: BgVariant;
  textVariant?: TextVariant;
  className?: string;
  style?: StyleProp<TextStyle>;
  multilineHeight?: number; 
};

export function ThemedTextInput({
  variant = "default",
  textVariant = "button",
  className = "",
  style,
  multilineHeight,
  ...rest
}: ThemedTextInputProps) {
  const { theme } = useThemeContext();

  const backgroundColor = INPUT_THEME[theme][variant];
  const textClasses = TEXT_THEME[theme][textVariant] || "";

  const isMultiline = rest.multiline || false;

  return (
    <TextInput
      {...rest}
      multiline={isMultiline}
      textAlignVertical={isMultiline ? "top" : "center"}
      scrollEnabled={isMultiline}
      className={clsx("px-4 py-2 rounded-md", textClasses, className)}
      style={[
        { backgroundColor },
        isMultiline && { height: multilineHeight || 120 },
        style,
      ]}
      placeholderTextColor={
        theme === "dark" ? "hsl(0 0% 63.9%)" : "hsl(0 0% 45.1%)"
      }
    />
  );
}
