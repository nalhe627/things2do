import { useState } from 'react';
import { Theme } from "@/constants/theme-context";

// Mock the theme state for autoamted tests
export const useTheme = () => {
    const [theme, setTheme] = useState<Theme>('light');
    return { setTheme, theme };
};