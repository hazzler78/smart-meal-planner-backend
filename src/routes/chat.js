import express from 'express';
import { authenticateToken } from '../utils/auth.js';
import { OpenAI } from 'openai';

const router = express.Router();

console.log('Chat routes module loaded');

let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-tests'
  });
} catch (error) {
  console.warn('Failed to initialize OpenAI:', error);
  // Create a mock OpenAI instance for tests
  openai = {
    chat: {
      completions: {
        create: async () => ({
          choices: [{
            message: {
              content: 'Mock response for testing'
            }
          }]
        })
      }
    }
  };
}

// Chat endpoint
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful cooking assistant."
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    res.json({
      message: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

export default router; 