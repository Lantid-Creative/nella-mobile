import { StatusBar } from "expo-status-bar";
import { useNellaTheme } from "@/lib/theme-context";

export default function App() {
  const { theme } = useNellaTheme();
  return <StatusBar style={theme.dark ? "light" : "dark"} />;
}
