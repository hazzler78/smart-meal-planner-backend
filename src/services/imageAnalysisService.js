import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI only in non-test environment
const openai = process.env.NODE_ENV !== 'test' ? new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1'
}) : null;

/**
 * Analyze an image from a URL
 * @param {string} imageUrl - The URL of the image to analyze
 * @param {string} prompt - The question or prompt about the image
 * @returns {Promise<string>} The analysis result
 */
export async function analyzeImageUrl(imageUrl, prompt = "What's in this image?") {
  if (process.env.NODE_ENV === 'test') {
    return JSON.stringify({
      items: [
        {
          name: "apple",
          quantity: 3,
          unit: "pieces",
          category: "fruit",
          state: "fresh"
        }
      ]
    });
  }

  try {
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail: "high",
            },
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "grok-2-vision-1212",
      messages: messages,
      temperature: 0.01,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error('Failed to analyze image');
  }
}

/**
 * Analyze an uploaded image file
 * @param {Buffer} imageBuffer - The image file buffer
 * @param {string} prompt - The question or prompt about the image
 * @returns {Promise<string>} The analysis result
 */
export async function analyzeImageFile(imageBuffer, prompt = "What's in this image?") {
  if (process.env.NODE_ENV === 'test') {
    return JSON.stringify({
      items: [
        {
          name: "milk",
          quantity: 1,
          unit: "gallon",
          category: "dairy",
          state: "fresh"
        }
      ]
    });
  }

  try {
    // Convert the buffer to base64
    const base64Image = imageBuffer.toString('base64');
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
              detail: "high",
            },
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "grok-2-vision-1212",
      messages: messages,
      temperature: 0.01,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error('Failed to analyze image');
  }
}

// Mock implementations for testing
export function getMockAnalysis() {
  if (process.env.NODE_ENV === 'test') {
    return JSON.stringify({
      items: [
        {
          name: "test item",
          quantity: 1,
          unit: "piece",
          category: "test",
          state: "fresh"
        }
      ]
    });
  }
  throw new Error('Mock analysis is only available in test environment');
} 