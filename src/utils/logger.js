const log4js = require('log4js');

//load log4js configuration from json config file
const config = require('./log4js-config.json');
log4js.configure(config);

/**
 * Returns a logger instance where:
 * - `file` category is the source filename
 * - `method` is passed at log time to identify the caller
 *
 * @param {string} fileName - Base name of the calling module (e.g. 'prompt-flow')
 */
function getLogger(fileName) {
  const logger = log4js.getLogger(fileName);
  return {
    debug: (method, msg) => logger.debug({ m: method }, msg),
    info:  (method, msg) => logger.info({ m: method }, msg),
    warn:  (method, msg) => logger.warn({ m: method }, msg),
    error: (method, msg) => logger.error({ m: method }, msg),
  };
}

module.exports = { getLogger };


// Usage elsewhere:
// const { getLogger } = require('../utils/logger');
// const logger = getLogger('prompt-flow');
// logger.info('sendPrompt', 'Prompt submitted to ChatGPT');
// logger.error('pollResponse', 'Failed to retrieve response', err);