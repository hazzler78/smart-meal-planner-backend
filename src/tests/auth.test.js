import jwt from 'jsonwebtoken';
import { generateToken, authenticateToken } from '../utils/auth.js';

const TEST_JWT_SECRET = 'test-secret-key';

describe('Authentication Utils Tests', () => {
  const mockUserId = '123456789';

  beforeAll(() => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  describe('Token Generation', () => {
    test('should generate valid JWT token', () => {
      const token = generateToken(mockUserId);
      expect(token).toBeTruthy();

      const decoded = jwt.verify(token, TEST_JWT_SECRET);
      expect(decoded).toHaveProperty('id', mockUserId);
      expect(decoded).toHaveProperty('exp');
    });

    test('should generate token that expires in 24 hours', () => {
      const token = generateToken(mockUserId);
      const decoded = jwt.verify(token, TEST_JWT_SECRET);
      
      const now = Math.floor(Date.now() / 1000);
      const oneDay = 24 * 60 * 60;
      
      expect(decoded.exp - now).toBeLessThanOrEqual(oneDay);
      expect(decoded.exp - now).toBeGreaterThan(oneDay - 60); // Allow 1 minute buffer
    });
  });

  describe('Token Authentication', () => {
    const mockReq = {
      header: jest.fn()
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const mockNext = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      mockRes.status.mockReturnThis();
    });

    test('should authenticate valid token', () => {
      const token = generateToken(mockUserId);
      mockReq.header.mockReturnValue(`Bearer ${token}`);

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe(mockUserId);
    });

    test('should reject request without token', () => {
      mockReq.header.mockReturnValue(null);

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Please authenticate' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject invalid token', () => {
      mockReq.header.mockReturnValue('Bearer invalid-token');

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Please authenticate' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject expired token', () => {
      // Generate token that's already expired
      const expiredToken = jwt.sign(
        { id: mockUserId },
        TEST_JWT_SECRET,
        { expiresIn: '0s' }
      );
      mockReq.header.mockReturnValue(`Bearer ${expiredToken}`);

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Please authenticate' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle malformed token header', () => {
      mockReq.header.mockReturnValue('malformed-token-header');

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Please authenticate' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
}); 