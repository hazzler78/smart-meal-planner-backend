const express = require('express');
const router = express.Router();
const userService = require('../services/userService');

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await userService.loginUser(email, password);
        
        if (result.success) {
            res.status(200).json({
                success: true,
                token: result.token,
                user: result.user
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
});

// Register route
router.post('/register', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        const result = await userService.registerUser({ email, password, username });

        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                user: result.user
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message || 'Registration failed'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error during registration',
            error: error.message
        });
    }
});

module.exports = router; 