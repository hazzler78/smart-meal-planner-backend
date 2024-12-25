import express from 'express';
import dotenv from 'dotenv';
import app from './app.js';

// Load environment variables
dotenv.config();

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
