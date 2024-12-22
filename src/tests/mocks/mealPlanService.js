const mockMealPlans = {
  plans: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0
  }
};

const getMealPlans = jest.fn().mockImplementation(async (filters = {}) => {
  const { search, startDate, endDate, page = 1, limit = 10 } = filters;
  
  let filteredPlans = [...mockMealPlans.plans];
  
  if (search) {
    filteredPlans = filteredPlans.filter(plan => 
      plan.name.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  if (startDate) {
    filteredPlans = filteredPlans.filter(plan => 
      new Date(plan.startDate) >= new Date(startDate)
    );
  }
  
  if (endDate) {
    filteredPlans = filteredPlans.filter(plan => 
      new Date(plan.startDate) <= new Date(endDate)
    );
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedPlans = filteredPlans.slice(startIndex, endIndex);
  
  return {
    plans: paginatedPlans,
    pagination: {
      page,
      limit,
      total: filteredPlans.length
    }
  };
});

const addMealPlan = jest.fn().mockImplementation(async (mealPlan) => {
  if (!mealPlan.name || !mealPlan.startDate || !mealPlan.meals) {
    throw new Error('Invalid meal plan data');
  }
  
  const newPlan = {
    id: `plan-${mockMealPlans.plans.length + 1}`,
    ...mealPlan,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockMealPlans.plans.push(newPlan);
  mockMealPlans.pagination.total += 1;
  
  return newPlan;
});

const updateMealPlan = jest.fn().mockImplementation(async (id, updates) => {
  const planIndex = mockMealPlans.plans.findIndex(p => p.id === id);
  if (planIndex === -1) {
    throw new Error('Meal plan not found');
  }
  
  mockMealPlans.plans[planIndex] = {
    ...mockMealPlans.plans[planIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  return mockMealPlans.plans[planIndex];
});

const deleteMealPlan = jest.fn().mockImplementation(async (id) => {
  const planIndex = mockMealPlans.plans.findIndex(p => p.id === id);
  if (planIndex === -1) {
    throw new Error('Meal plan not found');
  }
  
  mockMealPlans.plans.splice(planIndex, 1);
  mockMealPlans.pagination.total -= 1;
  
  return { success: true };
});

const autoGenerateMealPlan = jest.fn().mockImplementation(async (params) => {
  const { name, startDate, days, mealsPerDay } = params;
  
  if (!name || !startDate || !days || !mealsPerDay) {
    throw new Error('Invalid parameters for meal plan generation');
  }
  
  const meals = Array(days * mealsPerDay).fill().map((_, index) => ({
    id: `meal-${index + 1}`,
    name: `Auto-generated Meal ${index + 1}`,
    recipe: {
      name: 'Sample Recipe',
      ingredients: [
        { item: 'rice', quantity: 1 },
        { item: 'vegetables', quantity: 1 }
      ],
      instructions: ['Cook rice', 'Steam vegetables', 'Combine and serve'],
      prepTime: 15,
      cookTime: 20,
      servings: 4
    },
    day: Math.floor(index / mealsPerDay) + 1,
    mealNumber: (index % mealsPerDay) + 1
  }));
  
  const newPlan = await addMealPlan({
    name,
    startDate,
    days,
    mealsPerDay,
    meals
  });
  
  return newPlan;
});

const resetMealPlans = () => {
  mockMealPlans.plans = [];
  mockMealPlans.pagination = {
    page: 1,
    limit: 10,
    total: 0
  };
};

module.exports = {
  getMealPlans,
  addMealPlan,
  updateMealPlan,
  deleteMealPlan,
  autoGenerateMealPlan,
  resetMealPlans,
  mockMealPlans
}; 