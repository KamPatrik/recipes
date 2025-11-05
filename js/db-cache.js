// ========================================
// INDEXEDDB CACHE WRAPPER
// Bulletproof caching layer for Firestore data
// ========================================

class CacheDB {
    constructor() {
        this.dbName = 'StravaAppCache';
        this.version = 1;
        this.db = null;
        this.isSupported = this.checkSupport();
        this.initPromise = null;
    }

    // Check if IndexedDB is supported
    checkSupport() {
        try {
            return 'indexedDB' in window && window.indexedDB !== null;
        } catch (e) {
            console.warn('IndexedDB not supported:', e);
            return false;
        }
    }

    // Initialize database (call once on app start)
    async init() {
        // Return existing promise if already initializing
        if (this.initPromise) {
            return this.initPromise;
        }

        if (!this.isSupported) {
            console.warn('⚠️ IndexedDB not supported, caching disabled');
            return Promise.resolve();
        }

        this.initPromise = new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(this.dbName, this.version);

                request.onerror = () => {
                    console.error('❌ IndexedDB failed to open:', request.error);
                    this.isSupported = false;
                    resolve(); // Don't reject, just disable caching
                };

                request.onsuccess = () => {
                    this.db = request.result;
                    console.log('✅ IndexedDB initialized successfully');
                    resolve();
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;

                    // Store for activities (lightweight metadata)
                    if (!db.objectStoreNames.contains('activities')) {
                        const activityStore = db.createObjectStore('activities', { keyPath: 'userId' });
                        console.log('Created activities store');
                    }

                    // Store for stream data (heavy GPS/HR/speed data)
                    if (!db.objectStoreNames.contains('streams')) {
                        const streamStore = db.createObjectStore('streams', { keyPath: 'key' });
                        streamStore.createIndex('userId', 'userId', { unique: false });
                        streamStore.createIndex('timestamp', 'timestamp', { unique: false });
                        console.log('Created streams store');
                    }
                };

                request.onblocked = () => {
                    console.warn('⚠️ IndexedDB upgrade blocked - close other tabs');
                };

            } catch (error) {
                console.error('❌ IndexedDB initialization error:', error);
                this.isSupported = false;
                resolve(); // Don't fail, just disable caching
            }
        });

        return this.initPromise;
    }

    // Safe transaction wrapper with error handling
    async safeTransaction(storeName, mode, operation) {
        if (!this.isSupported || !this.db) {
            return null;
        }

        try {
            const tx = this.db.transaction([storeName], mode);
            const store = tx.objectStore(storeName);
            const result = await operation(store);
            
            return new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve(result);
                tx.onerror = () => {
                    console.error(`Transaction error on ${storeName}:`, tx.error);
                    resolve(null); // Don't reject, return null
                };
                tx.onabort = () => {
                    console.error(`Transaction aborted on ${storeName}`);
                    resolve(null);
                };
            });
        } catch (error) {
            console.error(`Safe transaction error on ${storeName}:`, error);
            return null;
        }
    }

    // Promisify IDB request
    promisifyRequest(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                console.error('IDB request error:', request.error);
                resolve(null); // Don't reject, return null
            };
        });
    }

    // ========================================
    // ACTIVITIES CACHE
    // ========================================

    async cacheActivities(userId, activities) {
        return this.safeTransaction('activities', 'readwrite', async (store) => {
            const request = store.put({
                userId: userId,
                data: activities,
                timestamp: Date.now()
            });
            await this.promisifyRequest(request);
            console.log(`💾 Cached ${activities.length} activities in IndexedDB`);
            return true;
        });
    }

    async getActivities(userId, maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
        return this.safeTransaction('activities', 'readonly', async (store) => {
            const request = store.get(userId);
            const result = await this.promisifyRequest(request);

            if (!result) {
                console.log('📭 No cached activities found');
                return null;
            }

            const age = Date.now() - result.timestamp;
            if (age > maxAge) {
                console.log(`⏰ Activity cache is stale (${Math.round(age / 3600000)}h old)`);
                return null;
            }

            console.log(`✅ Using cached activities (${result.data.length} activities, ${Math.round(age / 60000)}min old)`);
            return result.data;
        });
    }

    async clearActivitiesCache(userId) {
        return this.safeTransaction('activities', 'readwrite', async (store) => {
            const request = store.delete(userId);
            await this.promisifyRequest(request);
            console.log('🗑️ Cleared activities cache');
            return true;
        });
    }

    // ========================================
    // STREAM DATA CACHE
    // ========================================

    async cacheStream(userId, activityId, streamData) {
        if (!streamData) return false;

        return this.safeTransaction('streams', 'readwrite', async (store) => {
            const request = store.put({
                key: `${userId}_${activityId}`,
                userId: userId,
                activityId: activityId,
                data: streamData,
                timestamp: Date.now()
            });
            await this.promisifyRequest(request);
            return true;
        });
    }

    async getStream(userId, activityId, maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
        return this.safeTransaction('streams', 'readonly', async (store) => {
            const request = store.get(`${userId}_${activityId}`);
            const result = await this.promisifyRequest(request);

            if (!result) {
                return null;
            }

            const age = Date.now() - result.timestamp;
            if (age > maxAge) {
                return null;
            }

            return result.data;
        });
    }

    // Batch get streams for multiple activities (for heatmap)
    async getMultipleStreams(userId, activityIds, maxAge = 30 * 24 * 60 * 60 * 1000) {
        if (!this.isSupported || !this.db) {
            return {};
        }

        try {
            const results = {};
            const tx = this.db.transaction(['streams'], 'readonly');
            const store = tx.objectStore('streams');

            const promises = activityIds.map(async (activityId) => {
                const request = store.get(`${userId}_${activityId}`);
                const result = await this.promisifyRequest(request);
                
                if (result) {
                    const age = Date.now() - result.timestamp;
                    if (age <= maxAge) {
                        results[activityId] = result.data;
                    }
                }
            });

            await Promise.all(promises);
            
            const cachedCount = Object.keys(results).length;
            if (cachedCount > 0) {
                console.log(`✅ Found ${cachedCount}/${activityIds.length} streams in cache`);
            }
            
            return results;
        } catch (error) {
            console.error('Error getting multiple streams:', error);
            return {};
        }
    }

    // ========================================
    // CACHE MAINTENANCE
    // ========================================

    // Clean up old stream data to save space
    async cleanOldStreams(maxAge = 90 * 24 * 60 * 60 * 1000) { // 90 days default
        if (!this.isSupported || !this.db) {
            return 0;
        }

        try {
            const tx = this.db.transaction(['streams'], 'readwrite');
            const store = tx.objectStore('streams');
            const index = store.index('timestamp');
            const cutoffTime = Date.now() - maxAge;
            const range = IDBKeyRange.upperBound(cutoffTime);

            return new Promise((resolve) => {
                let deleteCount = 0;
                const request = index.openCursor(range);

                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        cursor.delete();
                        deleteCount++;
                        cursor.continue();
                    } else {
                        if (deleteCount > 0) {
                            console.log(`🗑️ Cleaned ${deleteCount} old stream entries`);
                        }
                        resolve(deleteCount);
                    }
                };

                request.onerror = () => {
                    console.error('Error cleaning old streams:', request.error);
                    resolve(0);
                };
            });
        } catch (error) {
            console.error('Error in cleanOldStreams:', error);
            return 0;
        }
    }

    // Clear all cache for a user (on logout or complete reset)
    async clearUserCache(userId) {
        if (!this.isSupported || !this.db) {
            return;
        }

        try {
            // Clear activities
            await this.clearActivitiesCache(userId);

            // Clear streams
            const tx = this.db.transaction(['streams'], 'readwrite');
            const streamStore = tx.objectStore('streams');
            const index = streamStore.index('userId');
            const range = IDBKeyRange.only(userId);

            return new Promise((resolve) => {
                let deleteCount = 0;
                const request = index.openCursor(range);

                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        cursor.delete();
                        deleteCount++;
                        cursor.continue();
                    } else {
                        if (deleteCount > 0) {
                            console.log(`🗑️ Cleared ${deleteCount} cached streams for user`);
                        }
                        resolve();
                    }
                };

                request.onerror = () => {
                    console.error('Error clearing user cache:', request.error);
                    resolve();
                };
            });
        } catch (error) {
            console.error('Error in clearUserCache:', error);
        }
    }

    // Get cache statistics
    async getCacheStats(userId) {
        if (!this.isSupported || !this.db) {
            return { supported: false };
        }

        try {
            const stats = {
                supported: true,
                activities: null,
                streamCount: 0,
                totalSize: 0
            };

            // Get activities info
            const activities = await this.getActivities(userId, Infinity);
            if (activities) {
                stats.activities = {
                    count: activities.length,
                    size: JSON.stringify(activities).length
                };
            }

            // Count streams
            const tx = this.db.transaction(['streams'], 'readonly');
            const store = tx.objectStore('streams');
            const index = store.index('userId');
            const range = IDBKeyRange.only(userId);

            return new Promise((resolve) => {
                const request = index.openCursor(range);
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        stats.streamCount++;
                        stats.totalSize += JSON.stringify(cursor.value.data).length;
                        cursor.continue();
                    } else {
                        console.log('📊 Cache stats:', stats);
                        resolve(stats);
                    }
                };
                request.onerror = () => resolve(stats);
            });
        } catch (error) {
            console.error('Error getting cache stats:', error);
            return { supported: false };
        }
    }
}

// ========================================
// GLOBAL INSTANCE
// ========================================

// Create single global instance
const cacheDB = new CacheDB();

// Initialize on script load
if (typeof window !== 'undefined') {
    cacheDB.init().catch(err => {
        console.error('Failed to initialize cache DB:', err);
    });
}
