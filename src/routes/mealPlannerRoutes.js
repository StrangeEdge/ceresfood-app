const express = require('express');
const router = express.Router();
const User = require('../config');
const { requireLogin } = require('./userAuth');

router.get('/meal-planner/:year/:month', requireLogin, async (req, res) => {
    try {
        const { year, month } = req.params;
        const user = await User.findOne({ username: req.session.username });
        
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const mealPlans = user.mealPlans.filter(plan => {
            const planDate = new Date(plan.date);
            return planDate >= startDate && planDate <= endDate;
        });

        res.json({
            success: true,
            mealPlans: mealPlans
        });
    } catch (error) {
        console.error('Error loading meal plans:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/meal-planner/add', requireLogin, async (req, res) => {
    try {
        const { date, recipeId, recipeLabel, recipeImage, recipeCalories, mealType } = req.body;
        const user = await User.findOne({ username: req.session.username });

        const mealPlanIndex = user.mealPlans.findIndex(
            plan => plan.date.toDateString() === new Date(date).toDateString()
        );

        if (mealPlanIndex === -1) {
            user.mealPlans.push({
                date: new Date(date),
                meals: [{
                    recipeId,
                    recipeLabel,
                    recipeImage,
                    recipeCalories,
                    mealType
                }]
            });
        } else {
            const mealIndex = user.mealPlans[mealPlanIndex].meals.findIndex(
                meal => meal.mealType === mealType
            );

            if (mealIndex !== -1) {
                user.mealPlans[mealPlanIndex].meals[mealIndex] = {
                    recipeId,
                    recipeLabel,
                    recipeImage,
                    recipeCalories,
                    mealType
                };
            } else {
                user.mealPlans[mealPlanIndex].meals.push({
                    recipeId,
                    recipeLabel,
                    recipeImage,
                    recipeCalories,
                    mealType
                });
            }
        }

        await user.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding meal:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/meal-planner/:date/:mealType', requireLogin, async (req, res) => {
    try {
        const { date, mealType } = req.params;
        const user = await User.findOne({ username: req.session.username });

        const mealPlanIndex = user.mealPlans.findIndex(
            plan => plan.date.toDateString() === new Date(date).toDateString()
        );

        if (mealPlanIndex !== -1) {
            user.mealPlans[mealPlanIndex].meals = user.mealPlans[mealPlanIndex].meals.filter(
                meal => meal.mealType !== mealType
            );

            if (user.mealPlans[mealPlanIndex].meals.length === 0) {
                user.mealPlans.splice(mealPlanIndex, 1);
            }

            await user.save();
            res.json({ success: true });
        } else {
            res.status(404).json({ 
                success: false, 
                error: 'Meal plan not found' 
            });
        }
    } catch (error) {
        console.error('Error deleting meal:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;
