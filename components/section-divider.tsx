import { ThemedView } from "@/components/themed-view";
import { useThemeContext } from "@/constants/theme-context";

/**
 * @author Chris Eberle
 * @returns A themed section divider component.
 */
export const SectionDivider = () => {
  const { theme } = useThemeContext();

  return (
    <ThemedView
      variant="muted"
      className="self-center my-4"
      style={{
        height: 1,
        width: "90%",
        backgroundColor:
          theme === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)",
      }}
    />
  );
};
