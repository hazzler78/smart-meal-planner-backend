class MockConfiguration {
  constructor(config) {
    this.apiKey = config.apiKey;
  }
}

class MockOpenAIApi {
  constructor(config) {
    this.config = config;
    this.createChatCompletion = jest.fn().mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: JSON.stringify([
                {
                  name: 'Test Recipe',
                  ingredients: ['ingredient1', 'ingredient2'],
                  instructions: ['step1', 'step2']
                }
              ])
            }
          }
        ]
      }
    });
  }
}

const mockOpenAI = new MockOpenAIApi(new MockConfiguration({ apiKey: 'test' }));

module.exports = {
  Configuration: MockConfiguration,
  OpenAIApi: jest.fn(() => mockOpenAI),
  mockOpenAI
}; 