import { View, ScrollView, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { ThemedText } from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "@/constants/theme-context";
import { Colors } from "@/constants/theme";
import { useState } from "react";
import { ThemedPressable } from "./themed-pressable";
import { ThemedView } from "./themed-view";

/* ---------------------------------------------
 * UI CONSTANTS (removes magic numbers)
 * --------------------------------------------- */
const MODAL_PADDING = 20;
const BLUR_INTENSITY = 69;
const DIM_OPACITY = 0.35;
const MAX_MODAL_WIDTH = 500;
const MODAL_CORNER_RADIUS = 14;
const ICON_SIZE_CLOSE = 22;
const ICON_SIZE_CHEVRON = 18;
const FAQ_ITEM_SPACING = 15;

/* ---------------------------------------------
 * FAQ Content
 * --------------------------------------------- */
const FAQS = [
  {
    q: "What is Things2Do?",
    a: "Things2Do is a social hub where people can find events, places, and activities happening in their area.",
  },
  {
    q: "How do I like a post?",
    a: "Navigate to the Discovery page. From there, swipe right to add the item to your ThingDeck or swipe left if you're not interested.",
  },
  {
    q: "How do I create a post?",
    a: "Go to the Create Post tab, fill out the required fields, and tap Share to publish your post.",
  },
  {
    q: "What is the ThingDeck?",
    a: "The ThingDeck stores all the posts you've swiped right on. It's your personalized collection of saved items.",
  },
  {
    q: "What is the dashboard?",
    a: "The Dashboard displays your created posts along with analytics and optional boosts to help increase their visibility.",
  },
];

/**
 * FAQModal
 *
 * Displays a modal FAQ panel with a blurred background.
 * Users can tap outside the modal or press the close button to dismiss it.
 *
 * @param onClose - Callback fired when the modal should be closed.
 * @returns A UI component containing the FAQ modal.
 */
export function FAQModal({ onClose }: { onClose: () => void }) {
  const { theme } = useThemeContext();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        padding: MODAL_PADDING,
      }}
    >
      {/* Background blur */}
      <BlurView
        intensity={BLUR_INTENSITY}
        tint="dark"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Dim overlay layer */}
      <Pressable
        onPress={onClose}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: `rgba(0,0,0,${DIM_OPACITY})`,
        }}
      />

      {/* Modal card */}
      <ThemedView
        variant="background"
        className="w-full p-5"
        style={{
          maxWidth: MAX_MODAL_WIDTH,
          borderRadius: MODAL_CORNER_RADIUS,
          zIndex: 10,
        }}
      >
        {/* Header */}
        <ThemedView
          variant="background"
          className="flex-row justify-between items-center mb-5"
        >
          <ThemedText className="text-xl font-semibold">FAQ</ThemedText>

          <ThemedPressable
            variant="foreground"
            className="w-8 h-8 rounded-lg items-center justify-center"
            onPress={onClose}
          >
            <Ionicons
              name="close"
              size={ICON_SIZE_CLOSE}
              color={Colors[theme].background}
            />
          </ThemedPressable>
        </ThemedView>

        {/* FAQ List */}
        <ScrollView
          className="max-h-[70vh]"
          showsVerticalScrollIndicator={false}
        >
          {FAQS.map((faq, index) => (
            <ThemedView
              variant="background"
              key={index}
              className="justify-center items-center "
              style={{ marginBottom: FAQ_ITEM_SPACING }}
            >
              <ThemedPressable
                variant="muted"
                className="p-3 w-full rounded-lg flex-row justify-between items-center"
                onPress={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <ThemedText variant="subheader">{faq.q}</ThemedText>

                <Ionicons
                  name={openIndex === index ? "chevron-up" : "chevron-down"}
                  size={ICON_SIZE_CHEVRON}
                  color={Colors[theme].text}
                />
              </ThemedPressable>
              <ThemedView
                variant="muted"
                className="flex-row w-3/4 rounded-lg justify-center items-center  translate-y-2"
              >
                {openIndex === index && (
                  <ThemedText variant="normal" className="mb-2 mt-2 w-8/9">
                    {faq.a}
                  </ThemedText>
                )}
              </ThemedView>
            </ThemedView>
          ))}
        </ScrollView>
      </ThemedView>
    </View>
  );
}
