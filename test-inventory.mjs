import { addItem } from './src/services/inventoryService.js';

try {
    const result = await addItem('test-item', 1);
    console.log('Added item successfully:', result);
} catch (error) {
    console.error('Error adding item:', error);
} 