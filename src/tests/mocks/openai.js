const mockOpenAIResponse = {
  choices: [
    {
      message: {
        content: JSON.stringify([
          {
            name: 'Vegetable Rice Bowl',
            ingredients: ['rice', 'vegetables'],
            instructions: ['Cook rice', 'Add vegetables']
          }
        ])
      }
    }
  ]
};

const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue(mockOpenAIResponse)
    }
  }
};

jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => mockOpenAI)
}));

module.exports = { mockOpenAI, mockOpenAIResponse }; 