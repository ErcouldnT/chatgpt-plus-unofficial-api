const log4js = require('log4js');

//load log4js configuration from json config file
const config = require('../configs/log4js-config.json');
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
        debug: (method, msg) => logger.debug(`[${method}] ${msg}`),
        info: (method, msg) => logger.info(`[${method}] ${msg}`),
        warn: (method, msg) => logger.warn(`[${method}] ${msg}`),
        error: (method, msg) => logger.error(`[${method}] ${msg}`),
    };
}

module.exports = { getLogger };


// Usage elsewhere:
// const { getLogger } = require('../utils/logger');
// const logger = getLogger('prompt-flow');
// logger.info('sendPrompt', 'Prompt submitted to ChatGPT');
// logger.error('pollResponse', 'Failed to retrieve response', err);