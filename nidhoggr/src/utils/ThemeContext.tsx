import { createContext, useContext, useState } from "react";

const lightColors = {
  background: "#f8f8fc",
  card: "#ffffff",
  text: "#000000",
  header: "#9EC54D",
  avatarBg: "#E5E0FF",
  avatarText: "#6B5EFF",
  fab: "#A6CE39",
};

const darkColors = {
  background: "#1c1c1e",
  card: "#2c2c2e",
  text: "#ffffff",
  header: "#3c3c3e",
  avatarBg: "#555",
  avatarText: "#fff",
  fab: "#4b8b2c",
};

const ThemeContext = createContext(null!);

export function ThemeProvider({ children }: any) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const colors = theme === "light" ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
