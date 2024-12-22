const faker = require('faker');

function generateTestUser(userContext, events, done) {
  const email = faker.internet.email();
  const password = faker.internet.password(12) + 'Aa1!';
  const name = faker.name.findName();

  userContext.vars.email = email;
  userContext.vars.password = password;
  userContext.vars.name = name;
  userContext.vars.currentDate = new Date().toISOString().split('T')[0];

  return done();
}

const inventoryItems = [
  'rice', 'pasta', 'quinoa', 'chicken', 'beef', 'tofu',
  'carrots', 'broccoli', 'spinach', 'tomatoes', 'onions',
  'garlic', 'olive oil', 'soy sauce', 'salt', 'pepper'
];

function getRandomItem(userContext, events, done) {
  const randomIndex = Math.floor(Math.random() * inventoryItems.length);
  userContext.vars.$randomItem = inventoryItems[randomIndex];
  return done();
}

module.exports = {
  generateTestUser,
  getRandomItem
}; 