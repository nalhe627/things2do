import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmStyle = "default",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View className="flex-1 justify-center items-center bg-black/50">
          <TouchableWithoutFeedback onPress={() => {}}>
            <View className="bg-white rounded-lg p-6 mx-4 w-80 max-w-full">
              <Text className="text-lg font-semibold mb-2 text-gray-900">
                {title}
              </Text>
              <Text className="text-base text-gray-600 mb-6">{message}</Text>

              <View className="flex-row justify-end space-x-3">
                <TouchableOpacity
                  className="px-4 py-2 rounded-lg bg-gray-100"
                  onPress={onCancel}
                >
                  <Text className="text-base font-medium text-gray-700">
                    {cancelText}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`px-4 py-2 rounded-lg ${
                    confirmStyle === "destructive"
                      ? "bg-red-500"
                      : "bg-blue-500"
                  }`}
                  onPress={onConfirm}
                >
                  <Text className="text-base font-medium text-white">
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
