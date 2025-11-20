// Logging middleware

const logger = (req, res, next) => {
  const start = Date.now();
  
  // Log the incoming request
  console.log(`🔄 ${req.method} ${req.originalUrl} - ${req.ip}`);
  
  // Override res.end to log response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Choose emoji based on status code
    let emoji = '✅';
    if (statusCode >= 400 && statusCode < 500) {
      emoji = '⚠️';
    } else if (statusCode >= 500) {
      emoji = '❌';
    }
    
    console.log(`${emoji} ${req.method} ${req.originalUrl} - ${statusCode} - ${duration}ms`);
    
    originalEnd.apply(this, args);
  };
  
  next();
};

module.exports = logger;
