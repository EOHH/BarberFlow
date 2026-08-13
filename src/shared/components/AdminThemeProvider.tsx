import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface AdminThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage, default to 'dark'
    const stored = localStorage.getItem('admin-ui-theme');
    return (stored === 'dark' || stored === 'light') ? stored : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('admin-ui-theme', theme);
    // Add or remove 'dark' class on HTML root for global tailwind dark mode if needed
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (context === undefined) {
    throw new Error('useAdminTheme must be used within an AdminThemeProvider');
  }
  return context;
}
