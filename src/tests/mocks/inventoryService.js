let mockInventory = {
  items: [
    { item: 'rice', quantity: 5 },
    { item: 'vegetables', quantity: 3 },
    { item: 'tofu', quantity: 2 }
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 3
  }
};

const getInventory = jest.fn().mockImplementation(async (filters = {}) => {
  const { search, page = 1, limit = 10 } = filters;
  
  let filteredItems = [...mockInventory.items];
  
  if (search) {
    filteredItems = filteredItems.filter(item => 
      item.item.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);
  
  return {
    items: paginatedItems,
    pagination: {
      page,
      limit,
      total: filteredItems.length
    }
  };
});

const addInventoryItem = jest.fn().mockImplementation(async ({ item, quantity }) => {
  if (!item || quantity <= 0) {
    throw new Error('Invalid item data');
  }
  
  const existingItem = mockInventory.items.find(i => i.item === item);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    mockInventory.items.push({ item, quantity });
    mockInventory.pagination.total += 1;
  }
  
  return { success: true };
});

const updateInventoryItem = jest.fn().mockImplementation(async ({ item, quantity }, operation) => {
  const existingItem = mockInventory.items.find(i => i.item === item);
  if (!existingItem) {
    throw new Error('Item not found');
  }
  
  if (operation === 'remove' && existingItem.quantity < quantity) {
    throw new Error('Insufficient quantity');
  }
  
  if (operation === 'remove') {
    existingItem.quantity -= quantity;
  } else {
    existingItem.quantity += quantity;
  }
  
  return { success: true };
});

const deleteInventoryItem = jest.fn().mockImplementation(async (itemName) => {
  const index = mockInventory.items.findIndex(i => i.item === itemName);
  if (index === -1) {
    throw new Error('Item not found');
  }
  
  mockInventory.items.splice(index, 1);
  mockInventory.pagination.total -= 1;
  
  return { success: true };
});

const resetInventory = () => {
  mockInventory = {
    items: [
      { item: 'rice', quantity: 5 },
      { item: 'vegetables', quantity: 3 },
      { item: 'tofu', quantity: 2 }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 3
    }
  };
  
  // Reset all mock implementations
  getInventory.mockImplementation(async (filters = {}) => {
    const { search, page = 1, limit = 10 } = filters;
    
    let filteredItems = [...mockInventory.items];
    
    if (search) {
      filteredItems = filteredItems.filter(item => 
        item.item.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);
    
    return {
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total: filteredItems.length
      }
    };
  });
  
  addInventoryItem.mockImplementation(async ({ item, quantity }) => {
    if (!item || quantity <= 0) {
      throw new Error('Invalid item data');
    }
    
    const existingItem = mockInventory.items.find(i => i.item === item);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      mockInventory.items.push({ item, quantity });
      mockInventory.pagination.total += 1;
    }
    
    return { success: true };
  });
  
  updateInventoryItem.mockImplementation(async ({ item, quantity }, operation) => {
    const existingItem = mockInventory.items.find(i => i.item === item);
    if (!existingItem) {
      throw new Error('Item not found');
    }
    
    if (operation === 'remove' && existingItem.quantity < quantity) {
      throw new Error('Insufficient quantity');
    }
    
    if (operation === 'remove') {
      existingItem.quantity -= quantity;
    } else {
      existingItem.quantity += quantity;
    }
    
    return { success: true };
  });
  
  deleteInventoryItem.mockImplementation(async (itemName) => {
    const index = mockInventory.items.findIndex(i => i.item === itemName);
    if (index === -1) {
      throw new Error('Item not found');
    }
    
    mockInventory.items.splice(index, 1);
    mockInventory.pagination.total -= 1;
    
    return { success: true };
  });
};

module.exports = {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  resetInventory,
  mockInventory
}; 