import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';

// Create the context
export const ThemeContext = createContext();

// Custom hook for using theme context
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Theme configuration that matches your CSS variables
const THEMES = {
    light: {
        name: 'light',
        colors: {
            primaryBg: '#ffffff',
            secondaryBg: '#ffffff',
            primaryText: '#000000',
            secondaryText: '#000000',
            accentColor: '#f01111',
            accentHover: '#a80f0f',
            navText: '#000000',
            navHover: '#f01111',
            iconColor: '#a80f0f',
            footerText: '#8d0f4e',
            borderColor: '#cccccc'
        }
    },
    dark: {
        name: 'dark',
        colors: {
            primaryBg: '#000000',
            secondaryBg: '#000000',
            primaryText: '#ffffff',
            secondaryText: '#ffffff',
            accentColor: '#f01111',
            accentHover: '#a80f0f',
            navText: '#ffffff',
            navHover: '#f01111',
            iconColor: '#a80f0f',
            footerText: '#8d0f4e',
            borderColor: '#cccccc'
        }
    }
};

export const ThemeProvider = ({ children }) => {
    // Initialize theme with system preference fallback
    const getInitialTheme = useCallback(() => {
        try {
            // Check localStorage first
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
                return savedTheme;
            }

            // Fallback to system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
        } catch (error) {
            console.warn('Error accessing localStorage or matchMedia:', error);
        }

        return 'light';
    }, []);

    const [theme, setTheme] = useState(getInitialTheme);
    const [isSystemTheme, setIsSystemTheme] = useState(() => {
        try {
            return !localStorage.getItem('theme');
        } catch {
            return true;
        }
    });

    // Listen for system theme changes
    useEffect(() => {
        if (!window.matchMedia) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e) => {
            // Only auto-switch if user is using system theme
            if (isSystemTheme) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        };

        // Modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
        // Legacy browsers
        else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleChange);
            return () => mediaQuery.removeListener(handleChange);
        }
    }, [isSystemTheme]);

    // Update localStorage and apply theme
    useEffect(() => {
        try {
            if (!isSystemTheme) {
                localStorage.setItem('theme', theme);
            } else {
                localStorage.removeItem('theme');
            }

            // Apply theme to document (for CSS variables)
            document.documentElement.setAttribute('data-theme', theme);

            // Apply class-based styling for legacy support
            document.body.className = theme;

            // Update meta theme-color for mobile browsers
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', theme === 'dark' ? '#000000' : '#ffffff');
            }

            // Dispatch custom event for other components that might need to know
            window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));

        } catch (error) {
            console.warn('Failed to save theme preference:', error);
        }
    }, [theme, isSystemTheme]);

    // Theme manipulation functions
    const toggleTheme = useCallback(() => {
        setIsSystemTheme(false);
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    }, []);

    const setLightTheme = useCallback(() => {
        setIsSystemTheme(false);
        setTheme('light');
    }, []);

    const setDarkTheme = useCallback(() => {
        setIsSystemTheme(false);
        setTheme('dark');
    }, []);

    const setSystemTheme = useCallback(() => {
        setIsSystemTheme(true);
        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(isDarkMode ? 'dark' : 'light');
    }, []);

    // Get current theme configuration
    const currentTheme = useMemo(() => THEMES[theme], [theme]);

    // Apply CSS variables dynamically
    useEffect(() => {
        const root = document.documentElement;
        const colors = currentTheme.colors;

        // Update CSS variables
        root.style.setProperty('--primary-bg', colors.primaryBg);
        root.style.setProperty('--secondary-bg', colors.secondaryBg);
        root.style.setProperty('--primary-text', colors.primaryText);
        root.style.setProperty('--secondary-text', colors.secondaryText);
        root.style.setProperty('--accent-color', colors.accentColor);
        root.style.setProperty('--accent-hover', colors.accentHover);
        root.style.setProperty('--nav-text', colors.navText);
        root.style.setProperty('--nav-hover', colors.navHover);
        root.style.setProperty('--icon-color', colors.iconColor);
        root.style.setProperty('--footer-text', colors.footerText);
        root.style.setProperty('--border-color', colors.borderColor);
    }, [currentTheme]);

    // Context value
    const value = useMemo(() => ({
        theme,
        toggleTheme,
        setLightTheme,
        setDarkTheme,
        setSystemTheme,
        isDark: theme === 'dark',
        isLight: theme === 'light',
        isSystemTheme,
        currentTheme,
        themes: THEMES
    }), [theme, toggleTheme, setLightTheme, setDarkTheme, setSystemTheme, isSystemTheme, currentTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// Optional: Theme toggle button component
export const ThemeToggleButton = ({ className = '' }) => {
    const { theme, toggleTheme, isSystemTheme, setSystemTheme } = useTheme();

    return (
        <button
            className={`theme-toggle ${className}`}
            onClick={toggleTheme}
            onContextMenu={(e) => {
                e.preventDefault();
                setSystemTheme();
            }}
            title={isSystemTheme ? 'Using system theme (right-click to toggle)' : `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </button>
    );
};

// Optional: Hook for components that need to react to theme changes
export const useThemeEffect = (callback) => {
    const { theme } = useTheme();

    useEffect(() => {
        callback(theme);
    }, [theme, callback]);
};

// Optional: HOC for theme-aware components
export const withTheme = (Component) => {
    return function ThemedComponent(props) {
        const themeContext = useTheme();
        return <Component {...props} theme={themeContext} />;
    };
};