const express = require('express');
const router = express.Router();
const { requireLogin } = require('./userAuth');
const User = require('../config');

router.get('/pantry', requireLogin, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.session.username });
        res.render('pantry', {
            username: req.session.username,
            pantryItems: user.pantryItems
        });
    } catch (error) {
        console.error('Error loading pantry:', error);
        res.status(500).send('Error loading pantry');
    }
});

router.post('/pantry/add', requireLogin, async (req, res) => {
    try {
        const { name, amount, unit } = req.body;
        const user = await User.findOne({ username: req.session.username });
        
        if (user.pantryItems.length >= 20) {
            return res.status(400).json({ 
                success: false, 
                error: 'You can only have up to 20 items in your pantry. Please remove some items to add more.' 
            });
        }
        
        user.pantryItems.push({
            name,
            amount: parseFloat(amount),
            unit
        });
        
        await user.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding ingredient:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


router.put('/pantry/update', requireLogin, async (req, res) => {
    try {
        const { id, amount, unit } = req.body;
        const user = await User.findOne({ username: req.session.username });
        
        const ingredient = user.pantryItems.id(id);
        if (!ingredient) {
            return res.status(404).json({ success: false, error: 'Ingredient not found' });
        }
        
        ingredient.amount = parseFloat(amount);
        ingredient.unit = unit;
        
        await user.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating ingredient:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/pantry/delete/:id', requireLogin, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.session.username });
        user.pantryItems.pull({ _id: req.params.id });
        await user.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting ingredient:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;