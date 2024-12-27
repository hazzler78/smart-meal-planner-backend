import { analyzeImageUrl, analyzeImageFile } from '../services/imageAnalysisService.js';

describe('Image Analysis Service', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  describe('analyzeImageUrl', () => {
    test('should return mock analysis in test environment', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      const result = await analyzeImageUrl(imageUrl);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      
      const parsedResult = JSON.parse(result);
      expect(parsedResult).toEqual({
        items: [
          expect.objectContaining({
            name: expect.any(String),
            quantity: expect.any(Number),
            unit: expect.any(String),
            category: expect.any(String),
            state: expect.any(String)
          })
        ]
      });
    });

    test('should handle custom prompts', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      const prompt = 'What colors are in this image?';
      const result = await analyzeImageUrl(imageUrl, prompt);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      
      const parsedResult = JSON.parse(result);
      expect(parsedResult).toEqual({
        items: [
          expect.objectContaining({
            name: expect.any(String),
            quantity: expect.any(Number),
            unit: expect.any(String),
            category: expect.any(String),
            state: expect.any(String)
          })
        ]
      });
    });
  });

  describe('analyzeImageFile', () => {
    test('should return mock analysis for uploaded files in test environment', async () => {
      const imageBuffer = Buffer.from('mock image data');
      const result = await analyzeImageFile(imageBuffer);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      
      const parsedResult = JSON.parse(result);
      expect(parsedResult).toEqual({
        items: [
          expect.objectContaining({
            name: expect.any(String),
            quantity: expect.any(Number),
            unit: expect.any(String),
            category: expect.any(String),
            state: expect.any(String)
          })
        ]
      });
    });

    test('should handle custom prompts for files', async () => {
      const imageBuffer = Buffer.from('mock image data');
      const prompt = 'Describe the objects in this image';
      const result = await analyzeImageFile(imageBuffer, prompt);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      
      const parsedResult = JSON.parse(result);
      expect(parsedResult).toEqual({
        items: [
          expect.objectContaining({
            name: expect.any(String),
            quantity: expect.any(Number),
            unit: expect.any(String),
            category: expect.any(String),
            state: expect.any(String)
          })
        ]
      });
    });

    test('should validate required fields in mock response', async () => {
      const imageBuffer = Buffer.from('mock image data');
      const result = await analyzeImageFile(imageBuffer);
      const parsedResult = JSON.parse(result);
      
      // Check that we have items array
      expect(parsedResult).toHaveProperty('items');
      expect(Array.isArray(parsedResult.items)).toBe(true);
      
      // Check each item has all required fields
      parsedResult.items.forEach(item => {
        expect(item).toEqual(
          expect.objectContaining({
            name: expect.any(String),
            quantity: expect.any(Number),
            unit: expect.any(String),
            category: expect.any(String),
            state: expect.any(String)
          })
        );
      });
    });
  });
}); 