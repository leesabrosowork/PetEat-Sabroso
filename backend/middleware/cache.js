const cache = new Map();

// Simple in-memory cache middleware
const cacheMiddleware = (duration = 300000) => { // Default 5 minutes
    return (req, res, next) => {
        const key = req.originalUrl || req.url;
        const cachedResponse = cache.get(key);

        if (cachedResponse && Date.now() - cachedResponse.timestamp < duration) {
            return res.json(cachedResponse.data);
        }

        // Store original res.json method
        const originalJson = res.json;

        // Override res.json method to cache the response
        res.json = function(data) {
            cache.set(key, {
                data: data,
                timestamp: Date.now()
            });
            
            // Call original method
            return originalJson.call(this, data);
        };

        next();
    };
};

// Clear cache for specific routes
const clearCache = (pattern) => {
    for (const key of cache.keys()) {
        if (key.includes(pattern)) {
            cache.delete(key);
        }
    }
};

// Clear all cache
const clearAllCache = () => {
    cache.clear();
};

module.exports = {
    cacheMiddleware,
    clearCache,
    clearAllCache
}; 