const express = require("express");
const session = require("express-session")
const MongoStore = require('connect-mongo');
const { router: userAuthRoutes, requireLogin } = require("./routes/userAuth");
const dotenv = require('dotenv').config()
const recipeRoutes = require('./routes/recipeRoutes');
const mealPlanner = require('./routes/mealPlannerRoutes')
const pantryRoutes = require('./routes/pantryRoutes')
const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI;
const User = require("./config");
const app = express();

mongoose.connect(MONGODB_URI)
.then(() => {
    console.log("Database Connected Successfully");
})
.catch((err) => {
    console.error("Database Connection Error:", err);
});

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
    app.use(session({
        secret: process.env.KEY,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ 
            mongoUrl: MONGODB_URI,
            autoRemove: 'native',
            ttl: 24 * 60 * 60
        }),
        cookie: { 
            secure: true,
            sameSite: 'none',
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true
        }
    }));
} else {
    app.use(session({
        secret: process.env.KEY,
        resave: false,
        saveUninitialized: false,
        cookie: { 
            secure: false,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true
        }
    }));
}

app.use(express.json());
app.use(express.static("public"));
app.use(express.static("src"));
app.use(express.urlencoded({ extended: false }));
app.use('/', recipeRoutes);
app.use(mealPlanner);
app.use(pantryRoutes);
app.use(userAuthRoutes);
app.use(express.static("public"));
app.use((req, res, next) => {
    res.locals.username = req.session.username;
    next();
});

app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/info", (req,res) =>{
    res.render("info");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/results", requireLogin, (req,res)=>{
    res.render("results", {username:req.session.username})
})

app.get("/recipe", requireLogin, (req,res) =>{
    res.render("recipe", {username:req.session.username})
})

app.get("/ceres", requireLogin, async (req,res)=>{
    const user = await User.findOne({username:req.session.username})
    const favoriteRecipes = user.favoriteRecipes
    const firstname = req.session.firstname;
    const featuredRecipes = [
        {
            recipeId: 'recipe_6cc647ecfe8307198dbc1be1a1021d0d',
            recipeImage: '',
            recipeLabel: 'Chicken Biryani'
        },
        {
            recipeId: 'recipe_0273b55ce12f439781ba3e225215f339',
            recipeImage: '',
            recipeLabel: 'Chicken Adobo'
        },
        {
            recipeId: 'recipe_16f8dfb2ef5d7b35e60230a4a6b12f5c',
            recipeImage: '',
            recipeLabel: 'Beef Caldereta'
        },
        {
            recipeId: 'recipe_c2f8f23ace72432980aa9fbfda38bbd1',
            recipeImage: '',
            recipeLabel: 'Beef Lo Mein'
        },
        {
            recipeId: 'recipe_1f90801ea884495eb84eaf6c20d206a4',
            recipeImage: '',
            recipeLabel: 'Fish and Chips'
        },
        {
            recipeId: 'recipe_219850ed54054b70bd72a650e61e8771',
            recipeImage: '',
            recipeLabel: 'Shakshuka'
        }
    ];
    
    res.render("ceres",{username:req.session.username,firstname, favoriteRecipes,recipes: featuredRecipes});
})

app.get("/pantry", requireLogin, (req,res)=>{
    res.render("pantry", {username:req.session.username});
})

app.get("/savedRecipes", requireLogin, async (req,res)=>{
    const user = await User.findOne({username:req.session.username})
    const favoriteRecipes = user.favoriteRecipes
    res.render("savedRecipes", {username:req.session.username, favoriteRecipes});
})

app.get("/mealPlanner", requireLogin, async (req,res)=>{
    try {
        const user = await User.findOne({username:req.session.username});
        const favoriteRecipes = user.favoriteRecipes;
        res.render("mealPlanner", {
            username: req.session.username,
            favoriteRecipes
        });
    } catch (error) {
        console.error('Error loading meal planner:', error);
        res.status(500).send('Error loading meal planner');
    }
});

app.get("/termsAndConditions", async(req,res)=>{
    res.render("termsAndConditions")
})

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running`);
});