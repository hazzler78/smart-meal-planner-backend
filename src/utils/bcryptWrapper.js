const bcrypt = require('bcrypt');

module.exports = {
  hash: async (password, saltRounds) => {
    return await bcrypt.hash(password, saltRounds);
  },
  compare: async (password, hash) => {
    return await bcrypt.compare(password, hash);
  }
}; 