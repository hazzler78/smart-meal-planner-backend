const generateRecipeSuggestions = jest.fn().mockImplementation(async (ingredients) => {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return [];
  }

  // Return mock recipe suggestions based on ingredients
  return [
    {
      name: 'Vegetable Stir Fry',
      ingredients: [
        { item: 'rice', quantity: 1 },
        { item: 'vegetables', quantity: 2 },
        { item: 'tofu', quantity: 1 }
      ],
      instructions: [
        'Cook rice according to package instructions',
        'Cut vegetables and tofu into bite-sized pieces',
        'Stir fry vegetables and tofu',
        'Serve over rice'
      ],
      prepTime: 15,
      cookTime: 20,
      servings: 4,
      dietaryRestrictions: ['vegetarian']
    },
    {
      name: 'Rice Bowl',
      ingredients: [
        { item: 'rice', quantity: 1 },
        { item: 'vegetables', quantity: 1 }
      ],
      instructions: [
        'Cook rice',
        'Steam vegetables',
        'Combine in bowl'
      ],
      prepTime: 10,
      cookTime: 15,
      servings: 2,
      dietaryRestrictions: ['vegetarian', 'vegan']
    }
  ];
});

const handleError = jest.fn().mockImplementation(async (error) => {
  console.error('AI Service Error:', error);
  return [];
});

module.exports = {
  generateRecipeSuggestions,
  handleError
}; 