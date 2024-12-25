const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../config");
const router = express.Router();
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5
});

function requireLogin(req, res, next) {
    if (req.session && req.session.username) {
        next();
    } else {
        res.redirect('/login');
    }
}

router.post("/login", loginLimiter, async(req,res)=>{
    try {
        const check = await User.findOne({ username: req.body.username });
        if (!check) {
            return res.status(401).json({ 
                error: "Username not found",
                field: "username"
            });
        }

        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ 
                error: "Invalid password",
                field: "password"
            });
        }
        
        req.session.username = check.username;
        req.session.firstname = check.firstname;
        res.json({ success: true });
        
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ 
            error: "An error occurred during login",
            field: "both"
        });
    }
});

router.post("/signup", async(req,res)=>{
    try {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordRegex.test(req.body.password)) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters long and contain uppercase, lowercase, and a number.',
                field: 'password'
            });
        }

        const existingUser = await User.findOne({ username: req.body.username });
        if (existingUser) {
            return res.status(400).json({
                error: 'User already exists. Please choose a different username.',
                field: 'username'
            });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        const data = {
            firstname: req.body.firstname,
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword
        };
        
        await User.create(data);
        res.json({ success: true });
        
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ 
            error: error.message,
            field: 'both'
        });
    }
});

router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
        }
        res.redirect('/login');
    });
});

module.exports = {
    router,
    requireLogin
};