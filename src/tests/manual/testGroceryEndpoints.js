import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_URL = 'http://localhost:5000/api';
let authToken = '';

const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

async function createTestUser() {
  try {
    console.log('Creating test user...');
    await axios.post(`${API_URL}/users/register`, TEST_USER);
    console.log('Test user created successfully');
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
      console.log('Test user already exists');
    } else {
      console.error('Error creating test user:', error.response?.data || error.message);
      process.exit(1);
    }
  }
}

async function login() {
  try {
    console.log('Logging in...');
    const response = await axios.post(`${API_URL}/users/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    authToken = response.data.token;
    console.log('Successfully logged in');
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function testUrlAnalysis() {
  try {
    console.log('\n=== Testing Grocery Analysis from URL ===');
    
    const imageUrl = 'https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fit=crop&q=80';
    
    const response = await axios.post(
      `${API_URL}/image-analysis/analyze-groceries/url`,
      {
        imageUrl,
        addToInventory: true
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\nAnalysis Result:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('URL analysis failed:', error.response?.data || error.message);
  }
}

async function testFileUpload() {
  try {
    console.log('\n=== Testing Grocery Analysis from File Upload ===');
    
    // Create form data
    const formData = new FormData();
    
    // Read test image file
    const imageBuffer = fs.readFileSync('src/tests/manual/test-grocery-image.jpg');
    formData.append('image', imageBuffer, 'test-grocery-image.jpg');
    formData.append('addToInventory', 'true');

    const response = await axios.post(
      `${API_URL}/image-analysis/analyze-groceries/upload`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...formData.getHeaders()
        }
      }
    );

    console.log('\nAnalysis Result:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('File upload analysis failed:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('Starting grocery analysis tests...');
  
  // Create test user if doesn't exist
  await createTestUser();
  
  // Login to get the auth token
  await login();
  
  // Test URL-based analysis
  await testUrlAnalysis();
  
  // Test file upload analysis
  await testFileUpload();
}

// Run all tests
runTests(); 