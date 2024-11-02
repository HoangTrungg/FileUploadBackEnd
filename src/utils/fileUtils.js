const crypto = require('crypto');

exports.generateShareLink = () => {
  return crypto.randomBytes(16).toString('hex');
};