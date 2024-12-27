import express from 'express';
import multer from 'multer';
import { analyzeImageUrl, analyzeImageFile } from '../services/imageAnalysisService.js';
import { addInventoryItem } from '../services/inventoryService.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Debug logging for all requests to this router
router.use((req, res, next) => {
  console.log('Image Analysis Request:', {
    method: req.method,
    path: req.path,
    body: req.body,
    files: req.files,
    file: req.file,
    headers: {
      ...req.headers,
      authorization: req.headers.authorization ? '[HIDDEN]' : undefined
    }
  });
  next();
});

/**
 * Clean the AI response to get valid JSON
 */
function cleanJsonResponse(response) {
  // Remove markdown code blocks if present
  response = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  return response;
}

/**
 * Analyze groceries from URL and optionally add to inventory
 */
router.post('/analyze-groceries/url', authenticateToken, async (req, res) => {
  try {
    const { imageUrl, addToInventory = false } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const prompt = `Analyze this image of groceries and provide a JSON array of items. Each item should have these properties:
    - name: the name of the item (string)
    - quantity: the approximate quantity (number)
    - unit: the unit of measurement (string, e.g., "pieces", "bunch", "kg", "bottle")
    - category: the category (string: "fruit", "vegetable", "dairy", "meat", "pantry", "condiment", "snack")
    - state: the state of the item (string: "fresh", "packaged", "canned", "frozen")
    
    Format the response as a JSON object with an "items" array containing the items. Example:
    {
      "items": [
        {
          "name": "apple",
          "quantity": 3,
          "unit": "pieces",
          "category": "fruit",
          "state": "fresh"
        }
      ]
    }`;

    const analysis = await analyzeImageUrl(imageUrl, prompt);
    const cleanedResponse = cleanJsonResponse(analysis);
    const parsedResult = JSON.parse(cleanedResponse);

    if (addToInventory && parsedResult.items) {
      // Add items to inventory
      for (const item of parsedResult.items) {
        await addInventoryItem(req.user.id, {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          state: item.state
        });
      }
    }

    res.json({
      analysis: parsedResult.items,
      addedToInventory: addToInventory
    });
  } catch (error) {
    console.error('Error analyzing groceries:', error);
    res.status(500).json({ error: 'Failed to analyze groceries' });
  }
});

/**
 * Analyze groceries from uploaded file and optionally add to inventory
 */
router.post('/analyze-groceries/upload', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const { addToInventory = false } = req.body;
    
    const prompt = `Analyze this image of groceries and provide a JSON array of items. Each item should have these properties:
    - name: the name of the item (string)
    - quantity: the approximate quantity (number)
    - unit: the unit of measurement (string, e.g., "pieces", "bunch", "kg", "bottle")
    - category: the category (string: "fruit", "vegetable", "dairy", "meat", "pantry", "condiment", "snack")
    - state: the state of the item (string: "fresh", "packaged", "canned", "frozen")
    
    Format the response as a JSON object with an "items" array containing the items. Example:
    {
      "items": [
        {
          "name": "apple",
          "quantity": 3,
          "unit": "pieces",
          "category": "fruit",
          "state": "fresh"
        }
      ]
    }`;

    const analysis = await analyzeImageFile(req.file.buffer, prompt);
    const cleanedResponse = cleanJsonResponse(analysis);
    const parsedResult = JSON.parse(cleanedResponse);

    if (addToInventory && parsedResult.items) {
      // Add items to inventory
      for (const item of parsedResult.items) {
        await addInventoryItem(req.user.id, {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          state: item.state
        });
      }
    }

    res.json({
      analysis: parsedResult.items,
      addedToInventory: addToInventory
    });
  } catch (error) {
    console.error('Error analyzing groceries:', error);
    res.status(500).json({ error: 'Failed to analyze groceries' });
  }
});

export default router; 