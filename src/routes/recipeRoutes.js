const express = require('express');
const axios = require('axios');
const router = express.Router();
const User = require("../config");
const {requireLogin} = require("../routes/userAuth");

const APP_ID = process.env.APP_ID;
const API_KEY = process.env.API_KEY;

router.post('/search', requireLogin, async (req, res) => {
    const {query} = req.body;
    let url = `https://api.edamam.com/api/recipes/v2?type=public&app_id=${APP_ID}&app_key=${API_KEY}&from=0&to=20`;
    
    const cuisines = Array.isArray(req.body.cuisine) 
    ? req.body.cuisine 
    : (req.body.cuisine ? [req.body.cuisine] : []);

    const healthLabels = Array.isArray(req.body.health) 
    ? req.body.health 
    : (req.body.health ? [req.body.health] : []);
    if (query){
        url +=`&q=${encodeURIComponent(query)}`;
    }

    if (cuisines.length > 0){
        const cuisineFilter = cuisines.map(cuisine =>
            `&cuisineType=${encodeURIComponent(cuisine)}`
        ).join('');
        url +=cuisineFilter;
    }

    if (healthLabels.length > 0){
        const healthLabelFilter = healthLabels.map(healthLabel =>
            `&health=${encodeURIComponent(healthLabel)}`
        ).join('');
        url +=healthLabelFilter;
    }

    try {
        const response = await axios.get(url);
        const data = response.data;
        const initialResults = data.hits;
        const nextPage = data._links && data._links.next ? data._links.next.href : null;

        res.render('results', { recipes: initialResults, 
            nextPage, 
            selectedCuisines: cuisines || [],
            selectedHealthLabels: healthLabels || [],
            username: req.session.username || ''
         });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/recipe/refresh/:recipeId', requireLogin, async (req, res) => {
    try {
        const { recipeId } = req.params;
        
        const url = `https://api.edamam.com/api/recipes/v2/${recipeId}?type=public&app_id=${APP_ID}&app_key=${API_KEY}`;
        const response = await axios.get(url);
        
        if (response.data && response.data.recipe) {
            await User.updateOne(
                { 
                    username: req.session.username,
                    'favoriteRecipes.recipeId': recipeId 
                },
                { 
                    $set: { 'favoriteRecipes.$.recipeImage': response.data.recipe.image }
                }
            );

            res.json({
                success: true,
                imageUrl: response.data.recipe.image
            });
        } else {
            throw new Error('Recipe not found');
        }
    } catch (error) {
        console.error('Error refreshing recipe:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/nextPage', async (req, res) => {
    const nextPageUrl = req.query.url;
    try {
        const response = await axios.get(nextPageUrl);
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to load more recipes');
    }
});

router.post('/favorite', requireLogin, async(req,res) => {
    try {
        const {recipeId, recipeLabel, recipeImage, recipeCalories} = req.body;
        const user = await User.findOne({ username: req.session.username });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const favoriteExists = user.favoriteRecipes.find(
            recipe => recipe.recipeId === recipeId
        );

        if (favoriteExists) {
            user.favoriteRecipes = user.favoriteRecipes.filter(
                recipe => recipe.recipeId !== recipeId
            );
        } else {
            if (user.favoriteRecipes.length >= 24) {
                return res.status(400).json({
                    success: false,
                    message: 'You can only save up to 24 recipes. Please remove some recipes to add more.'
                });
            }
            user.favoriteRecipes.push({
                recipeId,
                recipeLabel,
                recipeImage,
                recipeCalories,
                addedAt: new Date()
            });
        }

        await user.save();

        res.status(200).json({
            success: true,
            isFavorited: !favoriteExists,
            message: favoriteExists ? 'Recipe removed from favorites' : 'Recipe added to favorites'
        });

    } catch (error) {
        console.error('Favorite error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error handling favorite operation'
        });
    }
});

router.delete('/favorite/delete/:recipeId', requireLogin, async (req, res) => {
    try {
        const { recipeId } = req.params;
        const user = await User.findOne({ username: req.session.username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.favoriteRecipes = user.favoriteRecipes.filter(
            recipe => recipe.recipeId !== recipeId
        );

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Recipe removed from favorites'
        });
    } catch (error) {
        console.error('Delete favorite error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing recipe from favorites'
        });
    }
});

router.get('/results/recipe', async (req, res) => {
    const recipeId = req.query.recipe;
    const searchQuery = req.query.search;
   
    try {
        const url = `https://api.edamam.com/api/recipes/v2/${recipeId}?type=public&app_id=${APP_ID}&app_key=${API_KEY}`;
        const response = await axios.get(url);
        const recipeDetails = response.data.recipe;
        
        let isFavorited = false;
        if (req.session.username) {
            const user = await User.findOne({ username: req.session.username });
            isFavorited = user.favoriteRecipes.some(recipe => recipe.recipeId === recipeId);
        }
        
        res.render('recipe', {
            recipeDetails: {...recipeDetails, isFavorited},
            searchQuery: searchQuery,
            username: req.username ? req.user.username : ''
        });
    } catch (error) {
        console.error('Error details:', error.response ? error.response.data : error.message);
        res.status(500).send('An error occurred while fetching the recipe details.');
    }
});

module.exports = router;