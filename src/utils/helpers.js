// Contains reusable utility functions

const waitForTimeout = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

module.exports = {
  waitForTimeout,
};
