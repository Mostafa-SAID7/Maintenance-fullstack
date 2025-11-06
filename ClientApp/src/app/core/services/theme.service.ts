import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';

export interface ThemeConfig {
  name: string;
  displayName: string;
  isDark: boolean;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  hover: string;
  selected: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  animations: boolean;
  highContrast: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'theme-settings';
  private readonly storageKeyCurrentTheme = 'current-theme';
  
  private currentThemeSubject = new BehaviorSubject<ThemeConfig | null>(null);
  private settingsSubject = new BehaviorSubject<ThemeSettings>(this.getDefaultSettings());
  
  public currentTheme$ = this.currentThemeSubject.asObservable();
  public settings$ = this.settingsSubject.asObservable();

  // Predefined themes
  private readonly themes: { [key: string]: ThemeConfig } = {
    light: {
      name: 'light',
      displayName: 'Light Theme',
      isDark: false,
      primary: '#2196F3',
      secondary: '#607D8B',
      accent: '#FF5722',
      background: '#FAFAFA',
      surface: '#FFFFFF',
      text: '#212121',
      textSecondary: '#757575',
      border: '#E0E0E0',
      hover: '#F5F5F5',
      selected: '#E3F2FD',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      info: '#2196F3'
    },
    dark: {
      name: 'dark',
      displayName: 'Dark Theme',
      isDark: true,
      primary: '#64B5F6',
      secondary: '#90A4AE',
      accent: '#FF7043',
      background: '#121212',
      surface: '#1E1E1E',
      text: '#FFFFFF',
      textSecondary: '#B0B0B0',
      border: '#373737',
      hover: '#2C2C2C',
      selected: '#2C3E50',
      success: '#66BB6A',
      warning: '#FFA726',
      error: '#EF5350',
      info: '#42A5F5'
    },
    automotive: {
      name: 'automotive',
      displayName: 'Automotive Theme',
      isDark: false,
      primary: '#2C3E50',
      secondary: '#34495E',
      accent: '#E74C3C',
      background: '#F8F9FA',
      surface: '#FFFFFF',
      text: '#2C3E50',
      textSecondary: '#7F8C8D',
      border: '#BDC3C7',
      hover: '#ECF0F1',
      selected: '#E8F4FD',
      success: '#27AE60',
      warning: '#F39C12',
      error: '#E74C3C',
      info: '#3498DB'
    }
  };

  constructor(private storageService: StorageService) {
    this.initializeTheme();
  }

  /**
   * Initialize theme service
   */
  private initializeTheme(): void {
    this.loadSettings();
    this.loadCurrentTheme();
    this.applySystemThemePreference();
    this.setupThemeChangeListener();
  }

  /**
   * Load theme settings from storage
   */
  private loadSettings(): void {
    const savedSettings = this.storageService.get<ThemeSettings>(this.storageKey);
    if (savedSettings) {
      this.settingsSubject.next(savedSettings);
    }
  }

  /**
   * Load current theme from storage
   */
  private loadCurrentTheme(): void {
    const themeName = this.storageService.get<string>(this.storageKeyCurrentTheme);
    if (themeName && this.themes[themeName]) {
      this.setTheme(themeName);
    } else {
      // Default to light theme
      this.setTheme('light');
    }
  }

  /**
   * Apply system theme preference
   */
  private applySystemThemePreference(): void {
    if (this.settingsSubject.value.mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const themeName = prefersDark ? 'dark' : 'light';
      this.setTheme(themeName);
    }
  }

  /**
   * Setup system theme change listener
   */
  private setupThemeChangeListener(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (this.settingsSubject.value.mode === 'auto') {
        const themeName = e.matches ? 'dark' : 'light';
        this.setTheme(themeName);
      }
    });
  }

  /**
   * Set theme by name
   */
  setTheme(themeName: string): void {
    const theme = this.themes[themeName];
    if (!theme) {
      console.warn(`Theme ${themeName} not found`);
      return;
    }

    this.currentThemeSubject.next(theme);
    this.storageService.set(this.storageKeyCurrentTheme, themeName);
    this.applyThemeToDOM(theme);
  }

  /**
   * Apply theme to DOM
   */
  private applyThemeToDOM(theme: ThemeConfig): void {
    const root = document.documentElement;
    
    // Set CSS custom properties
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--secondary-color', theme.secondary);
    root.style.setProperty('--accent-color', theme.accent);
    root.style.setProperty('--background-color', theme.background);
    root.style.setProperty('--surface-color', theme.surface);
    root.style.setProperty('--text-color', theme.text);
    root.style.setProperty('--text-secondary-color', theme.textSecondary);
    root.style.setProperty('--border-color', theme.border);
    root.style.setProperty('--hover-color', theme.hover);
    root.style.setProperty('--selected-color', theme.selected);
    root.style.setProperty('--success-color', theme.success);
    root.style.setProperty('--warning-color', theme.warning);
    root.style.setProperty('--error-color', theme.error);
    root.style.setProperty('--info-color', theme.info);

    // Apply theme class to body
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${theme.name}`);

    // Set dark mode class
    if (theme.isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }

    // Apply additional theme-specific classes
    this.applyThemeSpecificStyles(theme);
  }

  /**
   * Apply theme-specific styles
   */
  private applyThemeSpecificStyles(theme: ThemeConfig): void {
    // High contrast mode
    if (this.settingsSubject.value.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    // Font size
    const fontSizeClass = {
      small: 'font-small',
      medium: 'font-medium',
      large: 'font-large'
    }[this.settingsSubject.value.fontSize];

    document.body.className = document.body.className.replace(/font-\w+/g, '');
    document.body.classList.add(fontSizeClass);

    // Compact mode
    if (this.settingsSubject.value.compactMode) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
  }

  /**
   * Update theme settings
   */
  updateSettings(settings: Partial<ThemeSettings>): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings = { ...currentSettings, ...settings };
    
    this.settingsSubject.next(newSettings);
    this.storageService.set(this.storageKey, newSettings);

    // If mode changed to auto, apply system preference
    if (settings.mode === 'auto') {
      this.applySystemThemePreference();
    }

    // Reapply theme to apply new settings
    const currentTheme = this.currentThemeSubject.value;
    if (currentTheme) {
      this.applyThemeToDOM(currentTheme);
    }
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme(): void {
    const currentTheme = this.currentThemeSubject.value;
    if (!currentTheme) return;

    const newThemeName = currentTheme.name === 'light' ? 'dark' : 'light';
    this.setTheme(newThemeName);
  }

  /**
   * Get available themes
   */
  getAvailableThemes(): ThemeConfig[] {
    return Object.values(this.themes);
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): ThemeConfig | null {
    return this.currentThemeSubject.value;
  }

  /**
   * Get current settings
   */
  getCurrentSettings(): ThemeSettings {
    return this.settingsSubject.value;
  }

  /**
   * Check if theme is dark
   */
  isDarkTheme(): boolean {
    const theme = this.currentThemeSubject.value;
    return theme ? theme.isDark : false;
  }

  /**
   * Generate CSS for theme
   */
  generateThemeCSS(): string {
    const theme = this.currentThemeSubject.value;
    if (!theme) return '';

    return `
      :root {
        --primary-color: ${theme.primary};
        --secondary-color: ${theme.secondary};
        --accent-color: ${theme.accent};
        --background-color: ${theme.background};
        --surface-color: ${theme.surface};
        --text-color: ${theme.text};
        --text-secondary-color: ${theme.textSecondary};
        --border-color: ${theme.border};
        --hover-color: ${theme.hover};
        --selected-color: ${theme.selected};
        --success-color: ${theme.success};
        --warning-color: ${theme.warning};
        --error-color: ${theme.error};
        --info-color: ${theme.info};
      }
    `;
  }

  /**
   * Export theme as JSON
   */
  exportTheme(): string {
    const theme = this.currentThemeSubject.value;
    const settings = this.settingsSubject.value;
    
    return JSON.stringify({
      theme,
      settings
    }, null, 2);
  }

  /**
   * Import theme from JSON
   */
  importTheme(themeJson: string): boolean {
    try {
      const data = JSON.parse(themeJson);
      
      if (data.theme) {
        this.setTheme(data.theme.name);
      }
      
      if (data.settings) {
        this.updateSettings(data.settings);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing theme:', error);
      return false;
    }
  }

  /**
   * Reset to default theme
   */
  resetToDefault(): void {
    this.setTheme('light');
    this.updateSettings(this.getDefaultSettings());
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): ThemeSettings {
    return {
      mode: 'light',
      primaryColor: '#2196F3',
      accentColor: '#FF5722',
      fontSize: 'medium',
      compactMode: false,
      animations: true,
      highContrast: false
    };
  }

  /**
   * Observe theme changes
   */
  onThemeChange(): Observable<ThemeConfig | null> {
    return this.currentTheme$;
  }

  /**
   * Observe settings changes
   */
  onSettingsChange(): Observable<ThemeSettings> {
    return this.settings$;
  }

  /**
   * Create custom theme
   */
  createCustomTheme(config: Partial<ThemeConfig>): void {
    if (!config.name) {
      console.error('Theme name is required');
      return;
    }

    const newTheme: ThemeConfig = {
      ...this.themes['light'],
      ...config
    };

    this.themes[config.name] = newTheme;
    this.setTheme(config.name);
  }

  /**
   * Remove custom theme
   */
  removeCustomTheme(themeName: string): void {
    if (this.themes[themeName]) {
      delete this.themes[themeName];
      
      // Switch to default theme if current theme was removed
      const currentTheme = this.currentThemeSubject.value;
      if (currentTheme && currentTheme.name === themeName) {
        this.setTheme('light');
      }
    }
  }

  /**
   * Get theme by name
   */
  getTheme(themeName: string): ThemeConfig | null {
    return this.themes[themeName] || null;
  }

  /**
   * Check if system prefers dark theme
   */
  static getSystemPrefersDark(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Check if system prefers reduced motion
   */
  static getSystemPrefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}