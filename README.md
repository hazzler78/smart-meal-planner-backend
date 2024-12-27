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
    "lint:fix": "eslint . --fix",
    "seed": "node src/scripts/seed.js",
    "migrate": "node src/scripts/migrate.js"
  },
  "keywords": ["meal-planning", "recipe-management", "inventory-system"],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.450.0",
    "@sendgrid/mail": "^7.7.0",
    "bcrypt": "^5.1.1",
    "bcryptjs": "^2.4.3",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.4",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.0",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "node-cache": "^5.1.2",
    "node-fetch": "^3.3.2",
    "openai": "^4.17.0",
    "redis": "^4.6.10",
    "sharp": "^0.32.6",
    "socket.io": "^4.7.2",
    "uuid": "^9.0.1",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@babel/core": "^7.23.2",
    "@babel/plugin-syntax-import-meta": "^7.10.4",
    "@babel/plugin-transform-modules-commonjs": "^7.23.2",
    "@babel/preset-env": "^7.23.2",
    "@faker-js/faker": "^8.2.0",
    "@types/jest": "^29.5.7",
    "babel-jest": "^29.7.0",
    "eslint": "^8.53.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.1",
    "husky": "^8.0.3",
    "jest": "^29.7.0",
    "lint-staged": "^15.0.2",
    "mongodb-memory-server": "^9.0.1",
    "nodemon": "^3.0.1",
    "prettier": "^3.0.3",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.1"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": [
      "/node_modules/"
    ]
  },
  "lint-staged": {
    "*.js": "eslint --cache --fix",
    "*.{js,css,md}": "prettier --write"
  }
}
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/smart-meal-planner
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_secret_key_here
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# External APIs
OPENAI_API_KEY=your-openai-api-key
XAI_API_KEY=your-xai-api-key

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=your-aws-region
AWS_S3_BUCKET=your-bucket-name

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
EMAIL_FROM=noreply@yourapp.com

# Security
CORS_ORIGIN=http://localhost:5000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=debug
LOG_FILE_PATH=logs/app.log

# Cache Configuration
CACHE_TTL=3600

# Feature Flags
ENABLE_NOTIFICATIONS=true
ENABLE_FILE_UPLOAD=true
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
- POST `/api/auth/logout` - Logout user
- POST `/api/auth/refresh-token` - Refresh JWT token
- GET `/api/auth/profile` - Get user profile

### Meal Plans
- GET `/api/mealplans` - Get all meal plans
- POST `/api/mealplans` - Create a meal plan
- GET `/api/mealplans/:id` - Get meal plan by ID
- PUT `/api/mealplans/:id` - Update meal plan
- DELETE `/api/mealplans/:id` - Delete meal plan
- POST `/api/mealplans/autogenerate` - Auto-generate meal plan
- GET `/api/mealplans/weekly` - Get weekly meal plan
- POST `/api/mealplans/:id/share` - Share meal plan with other users

### Inventory
- GET `/api/inventory` - Get inventory items
- POST `/api/inventory` - Add items to inventory
- PUT `/api/inventory/:id` - Update inventory item
- DELETE `/api/inventory/:id` - Delete inventory item
- POST `/api/inventory/batch` - Batch update inventory items
- GET `/api/inventory/low-stock` - Get low stock items
- POST `/api/inventory/scan` - Scan and add items to inventory

### Recipes
- GET `/api/recipes` - Get all recipes
- POST `/api/recipes` - Create a recipe
- GET `/api/recipes/:id` - Get recipe by ID
- PUT `/api/recipes/:id` - Update recipe
- DELETE `/api/recipes/:id` - Delete recipe
- GET `/api/recipes/search` - Search recipes by criteria
- GET `/api/recipes/popular` - Get popular recipes
- POST `/api/recipes/:id/rate` - Rate a recipe
- POST `/api/recipes/:id/favorite` - Add/remove recipe from favorites
- GET `/api/recipes/favorites` - Get user's favorite recipes

### Suggestions
- GET `/api/suggestions` - Get AI-powered recipe suggestions
- POST `/api/suggestions/preferences` - Update suggestion preferences
- GET `/api/suggestions/weekly` - Get weekly meal suggestions
- GET `/api/suggestions/seasonal` - Get seasonal recipe suggestions

### User Preferences
- GET `/api/preferences` - Get user preferences
- PUT `/api/preferences` - Update user preferences
- PUT `/api/preferences/dietary` - Update dietary preferences
- PUT `/api/preferences/allergies` - Update allergy information

### Shopping List
- GET `/api/shopping-list` - Get shopping list
- POST `/api/shopping-list` - Add items to shopping list
- DELETE `/api/shopping-list/:id` - Remove item from shopping list
- PUT `/api/shopping-list/:id` - Update shopping list item
- POST `/api/shopping-list/generate` - Generate shopping list from meal plan

### Image Analysis
- POST `/api/image-analysis/analyze` - Analyze food image for ingredient detection
- POST `/api/image-analysis/scan-receipt` - Scan and extract items from receipt
- POST `/api/image-analysis/nutrition` - Get nutritional information from food image
- GET `/api/image-analysis/history` - Get user's image analysis history

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