const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const userFilePath = path.join(__dirname, "../data/users.json");

// Ensure users file exists
if (!fs.existsSync(userFilePath)) {
  fs.writeFileSync(userFilePath, JSON.stringify([]));
}

const validateUser = (user) => {
  if (!user.email || !user.password) {
    throw new Error('Email and password are required');
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    throw new Error('Invalid email format');
  }
  
  if (user.password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
};

const loadUsers = () => {
  try {
    return JSON.parse(fs.readFileSync(userFilePath, 'utf-8'));
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
};

const saveUsers = (users) => {
  fs.writeFileSync(userFilePath, JSON.stringify(users, null, 2));
};

const register = async (userData) => {
  validateUser(userData);
  
  const users = loadUsers();
  
  if (users.some(u => u.email === userData.email)) {
    throw new Error('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  const newUser = {
    id: Date.now().toString(),
    email: userData.email,
    password: hashedPassword,
    preferences: userData.preferences || {},
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

const login = async (email, password) => {
  const users = loadUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

const getUserById = (id) => {
  const users = loadUsers();
  const user = users.find(u => u.id === id);
  
  if (!user) {
    throw new Error('User not found');
  }

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const updatePreferences = (userId, preferences) => {
  const users = loadUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  users[userIndex].preferences = {
    ...users[userIndex].preferences,
    ...preferences
  };

  saveUsers(users);
  return users[userIndex].preferences;
};

module.exports = {
  register,
  login,
  getUserById,
  updatePreferences
}; 