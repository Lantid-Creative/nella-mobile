import { useFonts } from "expo-font";

/** Loads the Nella brand font (Plus Jakarta Sans) with a system fallback. */
export function useNellaFonts() {
  const [loaded] = useFonts({
    // Plus Jakarta Sans from Google Fonts, loaded remotely
    "PlusJakartaSans": {
      src: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
    },
  });

  return loaded;
}
