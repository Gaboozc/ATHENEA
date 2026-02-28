/**
 * Cache Manager - Clear app data, cache, and reset storage
 * For offline apps, this manages localStorage cleanup
 */

export const cacheManager = {
  /**
   * Get current storage size
   */
  getStorageSize: () => {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    return {
      bytes: totalSize,
      kb: (totalSize / 1024).toFixed(2),
      mb: (totalSize / 1024 / 1024).toFixed(2),
    };
  },

  /**
   * Get storage breakdown by key
   */
  getStorageBreakdown: () => {
    const breakdown = [];
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const size = localStorage[key].length + key.length;
        breakdown.push({
          key,
          bytes: size,
          kb: (size / 1024).toFixed(2),
        });
      }
    }
    return breakdown.sort((a, b) => b.bytes - a.bytes);
  },

  /**
   * Clear all app data (DANGER: Cannot be undone)
   */
  clearAllData: () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear IndexedDB if exists
      if (window.indexedDB) {
        window.indexedDB.databases().then((databases) => {
          databases.forEach((db) => {
            window.indexedDB.deleteDatabase(db.name);
          });
        });
      }
      
      return { success: true, message: 'All data cleared successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Clear specific data types
   */
  clearDataType: (dataType) => {
    try {
      const keysToDelete = [];
      
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          // Check if key belongs to this data type
          // Redux Persist keys are like: persist:projects, persist:tasks, etc.
          if (key.includes(dataType.toLowerCase())) {
            keysToDelete.push(key);
          }
        }
      }
      
      keysToDelete.forEach(key => localStorage.removeItem(key));
      
      return { 
        success: true, 
        message: `Cleared ${keysToDelete.length} items for ${dataType}`,
        keysDeleted: keysToDelete.length 
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Clear old cache (items not accessed recently)
   */
  clearOldCache: (daysOld = 30) => {
    try {
      const now = Date.now();
      const threshold = daysOld * 24 * 60 * 60 * 1000;
      let clearedCount = 0;
      
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          try {
            const item = JSON.parse(localStorage[key]);
            if (item.timestamp && (now - item.timestamp > threshold)) {
              localStorage.removeItem(key);
              clearedCount++;
            }
          } catch (e) {
            // Not a JSON item, skip
          }
        }
      }
      
      return { 
        success: true, 
        message: `Cleared ${clearedCount} old cache items`,
        clearedCount 
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Optimize storage by compressing data
   */
  optimizeStorage: () => {
    try {
      let optimized = 0;
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        const originalSize = value.length;
        
        try {
          // Try to parse and re-stringify to remove extra whitespace
          const parsed = JSON.parse(value);
          const compacted = JSON.stringify(parsed);
          
          if (compacted.length < originalSize) {
            localStorage.setItem(key, compacted);
            optimized += (originalSize - compacted.length);
          }
        } catch (e) {
          // Not JSON, skip
        }
      });
      
      return { 
        success: true, 
        message: `Optimized storage, saved ${(optimized / 1024).toFixed(2)} KB`,
        bytesSaved: optimized 
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Export data before clearing (backup)
   */
  createBackupBeforeClear: () => {
    try {
      const backup = {};
      
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          backup[key] = localStorage[key];
        }
      }
      
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `athenea-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      return { success: true, message: 'Backup created successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Get cache statistics
   */
  getCacheStats: () => {
    const size = cacheManager.getStorageSize();
    const breakdown = cacheManager.getStorageBreakdown();
    const itemCount = Object.keys(localStorage).length;
    
    return {
      totalSize: size,
      itemCount,
      breakdown,
      limit: {
        bytes: 10 * 1024 * 1024, // 10MB typical limit
        mb: '10',
      },
      usagePercent: ((size.bytes / (10 * 1024 * 1024)) * 100).toFixed(2),
    };
  },
};
