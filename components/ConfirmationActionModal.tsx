import { View, Pressable } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ThemedPressable } from "@/components/themed-pressable";

interface ConfirmActionModalProps {
  title?: string;
  message: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmColor?: "red" | "blue" | "green";
}

/**
 * Generic confirmation modal used to confirm user actions...
 */
export default function ConfirmActionModal({
  title,
  message,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  confirmColor = "blue",
}: ConfirmActionModalProps) {
  const colorVariants: Record<string, string> = {
    red: "bg-red-200 text-red-700",
    blue: "bg-blue-200 text-blue-700",
    green: "bg-green-200 text-green-700",
  };

  const confirmVariant = colorVariants[confirmColor] || colorVariants.blue;

  return (
    <View className="absolute inset-0 justify-center items-center z-50">
      {/* Background overlay */}
      <View className="absolute inset-0 bg-black opacity-40" />

      {/* Modal container */}
      <ThemedView
        variant="popover"
        className="p-6 mx-5 rounded-2xl shadow-lg w-11/12"
      >
        {/* Optional title */}
        {title && (
          <ThemedText
            variant="header"
            className="text-center mb-2 font-semibold"
          >
            {title}
          </ThemedText>
        )}

        {/* Main message */}
        <ThemedText variant="subheader" className="text-center mb-3">
          {message}
        </ThemedText>

        {/* Optional description */}
        {description && (
          <ThemedText className="text-center mb-5 opacity-70">
            {description}
          </ThemedText>
        )}

        {/* Buttons row */}
        <View className="flex-row justify-between mt-3 px-5">
          {/* Cancel */}
          <ThemedPressable onPress={onCancel} className="px-8 py-2 rounded-lg">
            <ThemedText variant="subheader">{cancelText}</ThemedText>
          </ThemedPressable>

          {/* Confirm */}
          <Pressable
            onPress={onConfirm}
            className={`px-8 py-2 rounded-lg ${confirmVariant.split(" ")[0]}`}
          >
            <ThemedText
              variant="subheader"
              className={confirmVariant.split(" ").slice(1).join(" ")}
            >
              {confirmText}
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </View>
  );
}
