# Smart Meal Planner Backend

A Node.js backend service for the Smart Meal Planner application that helps users plan meals, manage inventory, and get AI-powered recipe suggestions.

## Features

- 🤖 AI-powered meal suggestions based on available ingredients
- 📝 Automatic meal plan generation
- 🗄️ Inventory management system
- 👤 User preference management
- 🔄 Recipe management with CRUD operations
- 🔒 JWT-based authentication

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (v4.4 or higher)

## Dependencies

```json
{
  "name": "smart-meal-planner-backend",
  "version": "1.0.0",
  "description": "Backend service for Smart Meal Planner application",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "bcrypt": "^5.1.1",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.21.2",
    "express-validator": "^7.0.1",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^7.6.3",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "node-cache": "^5.1.2",
    "node-fetch": "^3.3.2",
    "openai": "^4.77.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@babel/core": "^7.26.0",
    "@babel/plugin-syntax-import-meta": "^7.10.4",
    "@babel/plugin-transform-modules-commonjs": "^7.26.3",
    "@babel/preset-env": "^7.26.0",
    "@types/jest": "^29.5.14",
    "babel-jest": "^29.7.0",
    "eslint": "^8.45.0",
    "jest": "^29.0.0",
    "mongodb-memory-server": "^8.16.1",
    "nodemon": "^3.0.1",
    "supertest": "^6.3.3",
    "ts-jest": "^29.2.5"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/smart-meal-planner
JWT_SECRET=your-jwt-secret-key
OPENAI_API_KEY=your-openai-api-key
XAI_API_KEY=your-xai-api-key
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd smart-meal-planner-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user

### Meal Plans
- GET `/api/mealplans` - Get all meal plans
- POST `/api/mealplans` - Create a meal plan
- GET `/api/mealplans/:id` - Get meal plan by ID
- PUT `/api/mealplans/:id` - Update meal plan
- DELETE `/api/mealplans/:id` - Delete meal plan
- POST `/api/mealplans/autogenerate` - Auto-generate meal plan

### Inventory
- GET `/api/inventory` - Get inventory items
- POST `/api/inventory` - Add items to inventory
- PUT `/api/inventory` - Update inventory item

### Recipes
- GET `/api/recipes` - Get all recipes
- POST `/api/recipes` - Create a recipe
- GET `/api/recipes/:id` - Get recipe by ID
- PUT `/api/recipes/:id` - Update recipe
- DELETE `/api/recipes/:id` - Delete recipe

### Suggestions
- GET `/api/suggestions` - Get AI-powered recipe suggestions

## Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Project Structure

```
src/
├── app.js              # Express app setup
├── server.js           # Server entry point
├── config/             # Configuration files
├── routes/             # API routes
├── controllers/        # Route controllers
├── services/          # Business logic
├── models/            # Database models
├── middleware/        # Custom middleware
├── utils/             # Utility functions
└── tests/             # Test files
```

## Error Handling

The API uses standard HTTP status codes and returns errors in the following format:
```json
{
  "error": "Error message here"
}
```

Common status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 