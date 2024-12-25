import jwt from 'jsonwebtoken';

export function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
}

export function authenticateToken(req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ error: 'Please authenticate' });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Please authenticate' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = { id: decoded.id, userId: decoded.id }; // Make both id and userId available
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
} 