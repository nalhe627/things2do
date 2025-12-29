/**
 * Currently using ionicons, so this might not be necessary.
 * Useful if we want a specific image or icon that ionicon doesn't provide.
 */
export const ICONS = {
    // example import of an icon
    //'explore.fill': {
    //    light: require('@/assets/navIcons/lightMode/explore.png'),
    //    dark: require('@/assets/navIcons/darkMode/explore.png'),
    //},
    // Add more as needed
  } as const;
  
  export type IconSymbolName = keyof typeof ICONS;
  