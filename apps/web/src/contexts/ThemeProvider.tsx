import { ThemeProvider as ThemeContext } from "next-themes";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext
      storageKey="theme"
      defaultTheme="dark"
      attribute="class"
      disableTransitionOnChange={true}
    >
      {children}
    </ThemeContext>
  );
}

export default ThemeProvider;
