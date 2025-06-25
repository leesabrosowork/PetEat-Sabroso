// User preferences storage manager

const STORAGE_PREFIX = 'peteat_';

interface UserPreferences {
  notificationsEnabled: boolean;
  lastNotificationSeen?: string;
}

// Default user preferences
const defaultPreferences: UserPreferences = {
  notificationsEnabled: true,
};

// Get user preferences from localStorage
export const getUserPreferences = (): UserPreferences => {
  if (typeof window === 'undefined') return defaultPreferences;
  
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}preferences`);
    if (!stored) return defaultPreferences;
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse user preferences:', error);
    return defaultPreferences;
  }
};

// Save user preferences to localStorage
export const saveUserPreferences = (preferences: Partial<UserPreferences>): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const current = getUserPreferences();
    const updated = { ...current, ...preferences };
    
    localStorage.setItem(`${STORAGE_PREFIX}preferences`, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save user preferences:', error);
  }
};

// Clear all user preferences
export const clearUserPreferences = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}preferences`);
  } catch (error) {
    console.error('Failed to clear user preferences:', error);
  }
}; 