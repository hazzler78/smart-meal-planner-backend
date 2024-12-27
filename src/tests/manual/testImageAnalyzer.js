import { analyzeImageUrl } from '../../services/imageAnalysisService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test image URL - using a grocery image
const imageUrl = 'https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fit=crop&q=80';

async function testImageAnalyzer() {
  try {
    console.log('Testing grocery analyzer...');
    console.log('Image URL:', imageUrl);
    
    const prompt = `Analyze this image of groceries and provide a JSON array of items. Each item should have these properties:
    - name: the name of the item (string)
    - quantity: the approximate quantity (number)
    - unit: the unit of measurement (string, e.g., "pieces", "bunch", "kg", "bottle")
    - category: the category (string: "fruit", "vegetable", "dairy", "meat", "pantry", "condiment", "snack")
    - state: the state of the item (string: "fresh", "packaged", "canned", "frozen")
    
    Format the response as valid JSON that can be parsed. Only include items that are clearly visible and identifiable.
    Example format:
    {
      "items": [
        {
          "name": "banana",
          "quantity": 5,
          "unit": "pieces",
          "category": "fruit",
          "state": "fresh"
        }
      ]
    }`;
    
    const analysis = await analyzeImageUrl(imageUrl, prompt);
    
    console.log('\nGrocery Analysis Result:');
    try {
      // Try to parse the response as JSON
      const parsedResult = JSON.parse(analysis);
      console.log(JSON.stringify(parsedResult, null, 2));
      console.log('\nSuccessfully parsed as JSON!');
    } catch (error) {
      console.log('Raw response (not JSON):');
      console.log(analysis);
      console.error('Failed to parse as JSON:', error.message);
    }
  } catch (error) {
    console.error('Error analyzing groceries:', error);
  }
}

// Run the test
testImageAnalyzer(); 