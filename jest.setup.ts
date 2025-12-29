import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";

/**
 * This file sets up the jest testing suite to mock packages that jest doesnt recognize.
 */

jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons'
}));

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: true,
      assets: [],
    })
  ),
  MediaTypeOptions: { Images: "Images" },
}));

jest.mock("@/utils/supabase", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: "123" } } })),
    },
  },
}));

jest.mock("react-native/Libraries/EventEmitter/NativeEventEmitter");

jest.mock('@/context/auth', () => ({
  useAuth: () => 'user' 
}));