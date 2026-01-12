/**
 * Centralized storage management utility.
 * Handles safe JSON parsing/stringifying and provides constant keys.
 */

export const STORAGE_KEYS = {
  TOKEN: 'ACCESS_TOKEN',
  USER: 'USER',
  USER_DATA: 'USER_DATA',
  USER_ID: 'USER_ID',
  THEME: 'APP_THEME',
  COMPANY_ID: 'current_company_id',
  CURRENT_COMPANY: 'current_company',
};

class StorageManager {
  constructor(storage = localStorage) {
    this.storage = storage;
  }

  /**
   * Get an item from storage.
   * Automatically parses JSON if possible.
   * @param {string} key 
   * @param {any} defaultValue 
   * @returns {any}
   */
  get(key, defaultValue = null) {
    if (!this.storage) return defaultValue;
    
    const value = this.storage.getItem(key);
    if (value === null) return defaultValue;

    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }

  /**
   * Set an item in storage.
   * Automatically stringifies objects/arrays.
   * @param {string} key 
   * @param {any} value 
   */
  set(key, value) {
    if (!this.storage) return;

    if (typeof value === 'object' && value !== null) {
      this.storage.setItem(key, JSON.stringify(value));
    } else {
      this.storage.setItem(key, value);
    }
  }

  /**
   * Remove an item from storage.
   * @param {string} key 
   */
  remove(key) {
    if (!this.storage) return;
    this.storage.removeItem(key);
  }

  /**
   * Clear all app-specific keys (safe clear).
   * Avoids clearing unrelated items if hosted on shared domain (though localstorage is domain specific).
   * But we can iterate over STORAGE_KEYS to be safe.
   */
  clearAuth() {
    this.remove(STORAGE_KEYS.TOKEN);
    this.remove(STORAGE_KEYS.USER);
    this.remove(STORAGE_KEYS.USER_DATA);
    this.remove(STORAGE_KEYS.USER_ID);
    this.remove(STORAGE_KEYS.COMPANY_ID);
    // Note: We intentionally don't clear THEME so it persists across logins
  }
}

export const storage = new StorageManager(localStorage);
// Optional: export session storage manager if needed
export const sessionStorageManager = new StorageManager(sessionStorage);
