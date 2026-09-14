#!/usr/bin/env node
/**
 * RASKOP - Console Log Helper
 * 
 * Inject this ke data.js atau reservasi.js untuk better debugging
 * Logs all reservasi transactions untuk monitoring
 */

// Add this to your data.js or create a separate logging.js file

const RASKOP_LOG = {
  isDev: true, // Set to false in production
  
  /**
   * Log dengan timestamp dan format yang rapi
   */
  log(action, data = {}, level = 'info') {
    const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    const prefix = `[${timestamp}] [RASKOP/${action}]`;
    
    const levelIcons = {
      info: 'ℹ️',
      success: '✅',
      warn: '⚠️',
      error: '❌',
    };
    
    const icon = levelIcons[level] || '📝';
    
    const logObj = {
      timestamp,
      action,
      level,
      data,
    };
    
    if (this.isDev) {
      console.group(`${icon} ${prefix}`);
      console.log('Level:', level);
      console.table(data);
      console.groupEnd();
    }
    
    // Optionally send to external logging service
    // this.sendToLoggingService(logObj);
  },
  
  /**
   * Log reservasi submission
   */
  logReservation(state, action = 'submit') {
    this.log(`reservation_${action}`, {
      id: state.id || 'N/A',
      name: state.name,
      phone: state.phone,
      guests: state.guests,
      date: state.date,
      time: state.time,
      area: state.area,
      totalPrice: state.orders ? Object.values(state.orders).reduce((s, q) => s + q, 0) : 0,
      paymentMethod: state.payment,
    }, 'info');
  },
  
  /**
   * Log API error
   */
  logError(source, error, context = {}) {
    this.log(`error_${source}`, {
      message: error.message,
      stack: error.stack?.split('\n')[0],
      ...context,
    }, 'error');
  },
  
  /**
   * Log API success
   */
  logSuccess(source, response, context = {}) {
    this.log(`success_${source}`, {
      status: response.status,
      ...context,
    }, 'success');
  },
};

// Export untuk browser environment
if (typeof window !== 'undefined') {
  window.RASKOP_LOG = RASKOP_LOG;
}

module.exports = RASKOP_LOG;
