import { useFonts } from 'expo-font';

export function useNellaFonts() {
  const [loaded] = useFonts({
    'PlusJakartaSans': {
      src: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
    },
  });
  return loaded;
}
