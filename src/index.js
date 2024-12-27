import express from 'express';
import dotenv from 'dotenv';
import app from './app.js';

// Load environment variables
dotenv.config();

const port = process.env.PORT || 5000;

// Add this test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
