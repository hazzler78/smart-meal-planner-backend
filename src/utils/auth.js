const jwt = require('jsonwebtoken');

const JWT_SECRET = 'test-secret-key'; // Only for testing

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

module.exports = {
  generateToken,
  authenticateToken
}; 