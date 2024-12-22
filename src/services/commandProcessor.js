const processCommand = (command) => {
  command = command.toLowerCase().trim();

  // Helper function to parse quantity and units
  const parseQuantityAndUnits = (quantityStr, itemStr) => {
    const units = ['cups', 'cup', 'grams', 'gram', 'g', 'kg', 'oz', 'pounds', 'pound', 'lb', 'lbs', 'pieces', 'piece'];
    const quantity = parseInt(quantityStr);
    let item = itemStr;
    let unit = null;

    for (const u of units) {
      if (item.endsWith(` ${u}`)) {
        unit = u;
        item = item.slice(0, -u.length).trim();
        break;
      }
    }

    return { quantity, item, unit };
  };

  // Helper function to extract ingredients from a command
  const extractIngredients = (text) => {
    const ingredients = [];
    const parts = text.split(/\s+and\s+|\s*,\s*/);
    
    parts.forEach(part => {
      const match = part.match(/(\d+)?\s*(?:(cups?|tbsps?|tsps?|g|oz|ml|pieces?|whole)\s+)?(.+)/i);
      if (match) {
        const [, quantity, unit, item] = match;
        ingredients.push({
          item: item.trim(),
          quantity: quantity ? parseInt(quantity) : 1,
          unit: unit ? unit.toLowerCase().replace(/s$/, '') : undefined
        });
      }
    });

    return ingredients;
  };

  // What can I make with... pattern
  if (command.match(/what can i (make|cook) with/i)) {
    const ingredientsText = command.replace(/what can i (make|cook) with\s*/i, '').trim();
    const ingredients = extractIngredients(ingredientsText);
    return {
      action: 'findRecipesByIngredients',
      params: { ingredients }
    };
  }

  // Clear category from inventory pattern
  if (command.match(/^clear\s+all\s+(.+?)\s+(?:from|in)\s+(?:the\s+)?inventory/i)) {
    const [, category] = command.match(/^clear\s+all\s+(.+?)\s+(?:from|in)\s+(?:the\s+)?inventory/i);
    return {
      action: 'clearCategory',
      params: { category: category.trim() }
    };
  }

  // Recipe search patterns
  if (command.includes('find') || command.includes('search')) {
    const searchTerm = command.replace(/(find|search)(\s+for)?/i, '').trim();
    return {
      action: 'search',
      params: { search: searchTerm }
    };
  }

  // Inventory check patterns
  if (command.match(/^(check|show|get|view|how much)\s+(inventory|stock)/i)) {
    return {
      action: 'checkInventory',
      params: {}
    };
  }

  if (command.match(/^(check|show|get|view|how much)\s+(.+?)\s+(stock|inventory|quantity|left)/i)) {
    const [, , item] = command.match(/^(check|show|get|view|how much)\s+(.+?)\s+(stock|inventory|quantity|left)/i);
    return {
      action: 'checkItem',
      params: { item: item.trim() }
    };
  }

  // Inventory add patterns
  if (command.match(/^(add|put|place|stock)\s+/i)) {
    const addPattern = /^(?:add|put|place|stock)\s+(?:up\s+)?(?:with\s+)?(\d+)\s+(.+?)(?:\s+(?:to|in|into)\s+(?:the\s+)?(?:inventory|stock))?$/i;
    const match = command.match(addPattern);
    
    if (match) {
      const [, quantityStr, itemStr] = match;
      const { quantity, item, unit } = parseQuantityAndUnits(quantityStr, itemStr);
      return {
        action: 'addToInventory',
        params: {
          item: item.trim(),
          quantity: quantity,
          unit
        }
      };
    }
  }

  // Inventory remove patterns
  if (command.match(/^(remove|take|use|subtract)\s+/i)) {
    const removePattern = /^(?:remove|take|use|subtract)\s+(\d+)\s+(.+?)(?:\s+(?:from|out of)\s+(?:the\s+)?(?:inventory|stock))?$/i;
    const match = command.match(removePattern);
    
    if (match) {
      const [, quantity, item] = match;
      return {
        action: 'removeFromInventory',
        params: {
          item: item.trim(),
          quantity: parseInt(quantity)
        }
      };
    }
  }

  // Recipe creation patterns
  if (command.includes('create') || command.includes('add') || command.includes('make')) {
    const recipeParts = command.match(/(?:create|add|make)\s+(?:a\s+)?recipe\s+for\s+(.+?)\s+with\s+(.+?)(?:\s+instructions?:?\s+(.+))?$/i);
    if (recipeParts) {
      const [, name, ingredientsText, instructionsText] = recipeParts;
      
      // Parse ingredients
      const ingredients = extractIngredients(ingredientsText);

      // Parse instructions
      const instructions = instructionsText ? 
        instructionsText.split(/\.\s*|\s*,\s*|\s+then\s+/).filter(Boolean) :
        [];

      return {
        action: 'create',
        params: { name, ingredients, instructions }
      };
    }
  }

  // Delete recipe patterns
  if (command.includes('delete') || command.includes('remove recipe')) {
    const recipeName = command.replace(/(delete|remove)\s+recipe\s*/i, '').trim();
    return {
      action: 'delete',
      params: { name: recipeName }
    };
  }

  // Bulk inventory update patterns
  if (command.match(/^(add|put|place|stock)\s+multiple/i)) {
    const items = command.split('and').slice(1).map(itemStr => {
      const [quantityStr, ...itemParts] = itemStr.trim().split(/\s+/);
      const { quantity, item, unit } = parseQuantityAndUnits(quantityStr, itemParts.join(' '));
      return { quantity, item, unit };
    });

    return {
      action: 'bulkAddToInventory',
      params: { items }
    };
  }

  // Check recipe ingredients availability
  if (command.match(/^can i (make|cook|prepare)/i)) {
    const recipeName = command.replace(/^can i (make|cook|prepare)\s+/i, '').trim();
    return {
      action: 'checkRecipeAvailability',
      params: { name: recipeName }
    };
  }

  // Recipe planning patterns
  if (command.match(/^(plan|schedule|make)\s+(.+?)\s+for\s+(today|tomorrow|next|this)/i)) {
    const planPattern = /^(?:plan|schedule|make)\s+(.+?)\s+for\s+(.+)$/i;
    const [, recipeName, timeStr] = command.match(planPattern);
    
    const date = parseDateExpression(timeStr); // Helper function to parse natural date expressions
    return {
      action: 'planRecipe',
      params: {
        name: recipeName.trim(),
        date
      }
    };
  }

  // Ingredient substitution patterns
  if (command.match(/^what can i (use|substitute)\s+for/i)) {
    const ingredient = command.replace(/^what can i (use|substitute)\s+for\s+/i, '').trim();
    return {
      action: 'findSubstitutes',
      params: { ingredient }
    };
  }

  throw new Error('Command not recognized');
};

const getSuggestions = (command) => {
  const suggestions = [];
  if (command.includes('recipe')) {
    suggestions.push(
      "create recipe for [name] with [ingredients] instructions: [steps]",
      "find recipes with [ingredient]",
      "delete recipe [name]",
      "what can I make with [ingredients]"
    );
  }
  if (command.includes('inventory') || command.includes('stock')) {
    suggestions.push(
      "add [quantity] [item] to inventory",
      "check inventory",
      "remove [quantity] [item]",
      "clear all [category] from inventory"
    );
  }
  return suggestions;
};

module.exports = { processCommand, getSuggestions }; 