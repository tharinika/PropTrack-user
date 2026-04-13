"use client";

import { useTheme } from "../../contexts/ThemeContext";
import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";

const Toaster = ({ ...props }: ToasterProps) => {
  let theme: string = "light";
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
  } catch (error) {
    // Fallback to light theme if context is not available
    console.warn("Toaster: ThemeContext not available, using light theme");
  }

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-right"
      duration={4000}
      closeButton
      richColors
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-foreground group-[.toast]:opacity-90',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          success: 'group-[.toast]:bg-emerald-50 group-[.toast]:text-emerald-950 group-[.toast]:border-emerald-200 dark:group-[.toast]:bg-emerald-950/50 dark:group-[.toast]:text-emerald-50 dark:group-[.toast]:border-emerald-900',
          error: 'group-[.toast]:bg-red-50 group-[.toast]:text-red-950 group-[.toast]:border-red-200 dark:group-[.toast]:bg-red-950/50 dark:group-[.toast]:text-red-50 dark:group-[.toast]:border-red-900',
          info: 'group-[.toast]:bg-blue-50 group-[.toast]:text-blue-950 group-[.toast]:border-blue-200 dark:group-[.toast]:bg-blue-950/50 dark:group-[.toast]:text-blue-50 dark:group-[.toast]:border-blue-900',
          warning: 'group-[.toast]:bg-amber-50 group-[.toast]:text-amber-950 group-[.toast]:border-amber-200 dark:group-[.toast]:bg-amber-950/50 dark:group-[.toast]:text-amber-50 dark:group-[.toast]:border-amber-900',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };