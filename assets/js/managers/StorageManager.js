/**
 * Storage Manager - Handles localStorage and cookie storage operations
 */

class StorageManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.storageType = 'localStorage'; // 'localStorage' or 'cookies'
        this.prefix = 'itsybitsy_'; // Prefix for all storage keys
        this.cookieDefaults = {
            path: '/',
            maxAge: 31536000, // 1 year
            sameSite: 'Lax'
        };
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize storage manager
     */
    init() {
        try {
            this.detectStorageCapabilities();
            this.setupStorageEventListeners();
            this.isInitialized = true;
            
    
        } catch (error) {
            console.error('StorageManager initialization failed:', error);
        }
    }

    /**
     * Detect available storage capabilities
     */
    detectStorageCapabilities() {
        // Test localStorage availability
        const localStorageAvailable = this.testLocalStorage();
        
        if (localStorageAvailable) {
            this.storageType = 'localStorage';
        } else {
            this.storageType = 'cookies';
            console.warn('localStorage not available, falling back to cookies');
        }
        
        this.eventManager?.emit('storageTypeDetected', {
            type: this.storageType,
            localStorageAvailable
        });
    }

    /**
     * Test localStorage availability
     */
    testLocalStorage() {
        try {
            const testKey = 'test_storage';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Setup storage event listeners
     */
    setupStorageEventListeners() {
        // Listen for localStorage changes in other tabs
        if (this.storageType === 'localStorage') {
            window.addEventListener('storage', (event) => {
                if (event.key && event.key.startsWith(this.prefix)) {
                    const cleanKey = event.key.replace(this.prefix, '');
                    
                    this.eventManager?.emit('storageChanged', {
                        key: cleanKey,
                        oldValue: event.oldValue,
                        newValue: event.newValue,
                        source: 'external'
                    });
                }
            });
        }
        
        // Listen for beforeunload to save any pending data
        window.addEventListener('beforeunload', () => {
            this.flushPendingData();
        });
    }

    /**
     * Store data with automatic fallback
     */
    setItem(key, value, options = {}) {
        try {
            const prefixedKey = this.prefix + key;
            const serializedValue = this.serializeValue(value);
            
            if (this.storageType === 'localStorage') {
                localStorage.setItem(prefixedKey, serializedValue);
            } else {
                this.setCookie(prefixedKey, serializedValue, options);
            }
            
            this.eventManager?.emit('dataStored', {
                key,
                value,
                storageType: this.storageType
            });
            
            return true;
        } catch (error) {
            console.error(`Failed to store data for key ${key}:`, error);
            
            // Try fallback storage method
            return this.setItemFallback(key, value, options);
        }
    }

    /**
     * Retrieve data with automatic fallback
     */
    getItem(key, defaultValue = null) {
        try {
            const prefixedKey = this.prefix + key;
            let value = null;
            
            if (this.storageType === 'localStorage') {
                value = localStorage.getItem(prefixedKey);
            } else {
                value = this.getCookie(prefixedKey);
            }
            
            if (value === null) {
                // Try fallback storage method
                value = this.getItemFallback(key);
            }
            
            const deserializedValue = this.deserializeValue(value);
            
            this.eventManager?.emit('dataRetrieved', {
                key,
                value: deserializedValue,
                storageType: this.storageType
            });
            
            return deserializedValue !== null ? deserializedValue : defaultValue;
        } catch (error) {
            console.error(`Failed to retrieve data for key ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Remove data from storage
     */
    removeItem(key) {
        try {
            const prefixedKey = this.prefix + key;
            
            if (this.storageType === 'localStorage') {
                localStorage.removeItem(prefixedKey);
            } else {
                this.deleteCookie(prefixedKey);
            }
            
            // Also try to remove from fallback storage
            this.removeItemFallback(key);
            
            this.eventManager?.emit('dataRemoved', {
                key,
                storageType: this.storageType
            });
            
            return true;
        } catch (error) {
            console.error(`Failed to remove data for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Check if key exists in storage
     */
    hasItem(key) {
        try {
            const value = this.getItem(key);
            return value !== null;
        } catch (error) {
            console.error(`Failed to check existence of key ${key}:`, error);
            return false;
        }
    }

    /**
     * Clear all storage with prefix
     */
    clear() {
        try {
            if (this.storageType === 'localStorage') {
                // Remove only prefixed items
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.prefix)) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
            } else {
                // Clear all prefixed cookies
                this.clearPrefixedCookies();
            }
            
            this.eventManager?.emit('storageCleared', {
                storageType: this.storageType
            });
            
            return true;
        } catch (error) {
            console.error('Failed to clear storage:', error);
            return false;
        }
    }

    /**
     * Get all stored keys with prefix
     */
    getKeys() {
        try {
            const keys = [];
            
            if (this.storageType === 'localStorage') {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.prefix)) {
                        keys.push(key.replace(this.prefix, ''));
                    }
                }
            } else {
                // Get all cookie keys with prefix
                const cookies = document.cookie.split(';');
                cookies.forEach(cookie => {
                    const [name] = cookie.trim().split('=');
                    if (name.startsWith(this.prefix)) {
                        keys.push(name.replace(this.prefix, ''));
                    }
                });
            }
            
            return keys;
        } catch (error) {
            console.error('Failed to get storage keys:', error);
            return [];
        }
    }

    /**
     * Get storage usage statistics
     */
    getStorageInfo() {
        try {
            const info = {
                type: this.storageType,
                available: true,
                keyCount: 0,
                estimatedSize: 0
            };
            
            if (this.storageType === 'localStorage') {
                info.keyCount = this.getKeys().length;
                
                // Estimate localStorage usage
                let totalSize = 0;
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.prefix)) {
                        const value = localStorage.getItem(key);
                        totalSize += key.length + (value ? value.length : 0);
                    }
                }
                info.estimatedSize = totalSize;
                
                // Check if localStorage is near limit
                try {
                    const testData = 'x'.repeat(1024 * 1024); // 1MB test
                    localStorage.setItem('test_limit', testData);
                    localStorage.removeItem('test_limit');
                    info.nearLimit = false;
                } catch {
                    info.nearLimit = true;
                }
            } else {
                info.keyCount = this.getKeys().length;
                info.estimatedSize = document.cookie.length;
                info.nearLimit = document.cookie.length > 3000; // Cookie size concern
            }
            
            return info;
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return {
                type: this.storageType,
                available: false,
                keyCount: 0,
                estimatedSize: 0,
                error: error.message
            };
        }
    }

    /**
     * Fallback storage methods
     */
    setItemFallback(key, value, options = {}) {
        try {
            const prefixedKey = this.prefix + key;
            const serializedValue = this.serializeValue(value);
            
            if (this.storageType === 'localStorage') {
                // Fallback to cookies
                this.setCookie(prefixedKey, serializedValue, options);
            } else {
                // Fallback to memory storage (session only)
                this.setMemoryItem(prefixedKey, serializedValue);
            }
            
            return true;
        } catch (error) {
            console.error(`Fallback storage failed for key ${key}:`, error);
            return false;
        }
    }

    getItemFallback(key) {
        try {
            const prefixedKey = this.prefix + key;
            
            if (this.storageType === 'localStorage') {
                // Try cookies
                return this.getCookie(prefixedKey);
            } else {
                // Try localStorage
                return localStorage.getItem(prefixedKey);
            }
        } catch (error) {
            return null;
        }
    }

    removeItemFallback(key) {
        try {
            const prefixedKey = this.prefix + key;
            
            if (this.storageType === 'localStorage') {
                this.deleteCookie(prefixedKey);
            } else {
                localStorage.removeItem(prefixedKey);
            }
        } catch (error) {
            console.error(`Fallback removal failed for key ${key}:`, error);
        }
    }

    /**
     * Cookie management methods
     */
    setCookie(name, value, options = {}) {
        const opts = { ...this.cookieDefaults, ...options };
        let cookieString = `${name}=${encodeURIComponent(value)}`;
        
        if (opts.maxAge) {
            cookieString += `; max-age=${opts.maxAge}`;
        }
        
        if (opts.path) {
            cookieString += `; path=${opts.path}`;
        }
        
        if (opts.domain) {
            cookieString += `; domain=${opts.domain}`;
        }
        
        if (opts.secure) {
            cookieString += `; secure`;
        }
        
        if (opts.sameSite) {
            cookieString += `; samesite=${opts.sameSite}`;
        }
        
        document.cookie = cookieString;
    }

    getCookie(name) {
        const cookies = document.cookie.split(';');
        
        for (let cookie of cookies) {
            const [cookieName, cookieValue] = cookie.trim().split('=');
            if (cookieName === name) {
                return decodeURIComponent(cookieValue || '');
            }
        }
        
        return null;
    }

    deleteCookie(name) {
        this.setCookie(name, '', { maxAge: 0 });
    }

    clearPrefixedCookies() {
        const cookies = document.cookie.split(';');
        
        cookies.forEach(cookie => {
            const [name] = cookie.trim().split('=');
            if (name.startsWith(this.prefix)) {
                this.deleteCookie(name);
            }
        });
    }

    /**
     * Memory storage (session only, for extreme fallback)
     */
    setMemoryItem(key, value) {
        if (!window._memoryStorage) {
            window._memoryStorage = new Map();
        }
        window._memoryStorage.set(key, value);
    }

    getMemoryItem(key) {
        if (!window._memoryStorage) {
            return null;
        }
        return window._memoryStorage.get(key) || null;
    }

    /**
     * Value serialization/deserialization
     */
    serializeValue(value) {
        try {
            if (typeof value === 'string') {
                return value;
            }
            return JSON.stringify(value);
        } catch (error) {
            console.error('Failed to serialize value:', error);
            return String(value);
        }
    }

    deserializeValue(value) {
        if (!value) return null;
        
        try {
            // Try to parse as JSON first
            return JSON.parse(value);
        } catch {
            // Return as string if not valid JSON
            return value;
        }
    }

    /**
     * Batch operations
     */
    setMultiple(items, options = {}) {
        const results = {};
        
        Object.entries(items).forEach(([key, value]) => {
            results[key] = this.setItem(key, value, options);
        });
        
        this.eventManager?.emit('batchDataStored', {
            items: Object.keys(items),
            results,
            storageType: this.storageType
        });
        
        return results;
    }

    getMultiple(keys, defaultValue = null) {
        const results = {};
        
        keys.forEach(key => {
            results[key] = this.getItem(key, defaultValue);
        });
        
        this.eventManager?.emit('batchDataRetrieved', {
            keys,
            results,
            storageType: this.storageType
        });
        
        return results;
    }

    /**
     * Data synchronization between storage types
     */
    syncToLocalStorage() {
        if (this.storageType === 'localStorage') return;
        
        try {
            const keys = this.getKeys();
            keys.forEach(key => {
                const value = this.getItem(key);
                if (value !== null) {
                    localStorage.setItem(this.prefix + key, this.serializeValue(value));
                }
            });
            
    
        } catch (error) {
            console.error('Failed to sync to localStorage:', error);
        }
    }

    syncToCookies() {
        if (this.storageType === 'cookies') return;
        
        try {
            const keys = this.getKeys();
            keys.forEach(key => {
                const value = this.getItem(key);
                if (value !== null) {
                    this.setCookie(this.prefix + key, this.serializeValue(value));
                }
            });
            
    
        } catch (error) {
            console.error('Failed to sync to cookies:', error);
        }
    }

    /**
     * Handle pending data flush
     */
    flushPendingData() {
        // This could be used for write-behind caching or batch operations
        // Currently just ensures all data is committed
        this.eventManager?.emit('dataFlushed', {
            storageType: this.storageType
        });
    }

    /**
     * Storage migration utilities
     */
    migrateFromOldKeys(keyMappings) {
        Object.entries(keyMappings).forEach(([oldKey, newKey]) => {
            // Try to get data with old key (without prefix)
            const oldValue = localStorage.getItem(oldKey) || this.getCookie(oldKey);
            
            if (oldValue) {
                // Store with new key (with prefix)
                this.setItem(newKey, this.deserializeValue(oldValue));
                
                // Remove old key
                localStorage.removeItem(oldKey);
                this.deleteCookie(oldKey);
                
        
            }
        });
    }

    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            storageType: this.storageType,
            storageInfo: this.getStorageInfo(),
            prefix: this.prefix,
            keys: this.getKeys()
        };
    }

    /**
     * Destroy storage manager
     */
    destroy() {
        try {
            // Remove event listeners
            window.removeEventListener('storage', this.handleStorageChange);
            window.removeEventListener('beforeunload', this.flushPendingData);
            
            // Clean up references
            this.eventManager = null;
            
    
        } catch (error) {
            console.error('Error destroying StorageManager:', error);
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
} 