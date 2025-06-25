const performance = require('perf_hooks').performance;

// Performance monitoring middleware
const performanceMiddleware = (req, res, next) => {
    const start = performance.now();
    
    // Override res.json to measure response time
    const originalJson = res.json;
    res.json = function(data) {
        const end = performance.now();
        const duration = end - start;
        
        console.log(`🚀 ${req.method} ${req.originalUrl} - ${duration.toFixed(2)}ms`);
        
        // Log slow requests
        if (duration > 1000) {
            console.warn(`⚠️ Slow request detected: ${req.method} ${req.originalUrl} took ${duration.toFixed(2)}ms`);
        }
        
        return originalJson.call(this, data);
    };
    
    next();
};

// Query performance monitoring
const monitorQuery = async (queryName, queryFn) => {
    const start = performance.now();
    try {
        const result = await queryFn();
        const end = performance.now();
        const duration = end - start;
        
        console.log(`📊 Query ${queryName} - ${duration.toFixed(2)}ms`);
        
        if (duration > 500) {
            console.warn(`⚠️ Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
        }
        
        return result;
    } catch (error) {
        const end = performance.now();
        const duration = end - start;
        console.error(`❌ Query ${queryName} failed after ${duration.toFixed(2)}ms:`, error.message);
        throw error;
    }
};

module.exports = {
    performanceMiddleware,
    monitorQuery
}; 