const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstname: {
        type:String,
        required: true
    },
    username: {
        type:String,
        required: true
    },
    email:{
        type:String,
        required:true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
        type: String,
        required: true
    },
    pantryItems: [
        {
            name: {type:String, required:true},
            amount: {type:Number, required:true, min:1},
            unit: {type:String, required:true, enum:['mg','g','kg','L','mL']},
            added: {type:Date, default: Date.now}
        }
    ],
    favoriteRecipes: [
        {
            recipeId: { type: String, required: true },
            recipeLabel: { type: String, required: true },
            recipeImage: { type: String },
            recipeCalories: { type: Number },
            addedAt: { type: Date, default: Date.now }
        }
    ],
    mealPlans: [{
        date: {
            type: Date,
            required: true
        },
        meals: [{
            recipeId: { type: String },
            recipeLabel: { type: String },
            recipeImage: { type: String },
            recipeCalories: { type: Number },
            mealType: { 
                type: String, 
                enum: ['breakfast', 'lunch', 'dinner', 'snack'],
                required: true 
            }
        }]        
    }]
});

const User = new mongoose.model("users", UserSchema);
module.exports = User;