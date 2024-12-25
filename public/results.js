function showToastNotification(success, message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <div class="checkmark">${success ? '😁' : '❌'}</div>
        <div class="toast-message">${message}</div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 2000);
}

function handleFavoriteClick(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const recipeId = button.dataset.id;
    
    const recipeCard = button.closest('li');
    const recipeLabel = recipeCard.querySelector('h2').textContent;
    const recipeImage = recipeCard.querySelector('img').src;
    const recipeCalories = parseFloat(recipeCard.querySelector('p').textContent.split(': ')[1]);

    button.classList.toggle('favorited');
    
    fetch('/favorite', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            recipeId,
            recipeLabel,
            recipeImage,
            recipeCalories
        })
    })
    .then(response => response.json())
    .then(data => {
        showToastNotification(data.success, data.message);
        if (!data.success) {
            button.classList.toggle('favorited');
        }
    })
    .catch(error => {
        console.error('Error updating favorite status:', error);
        button.classList.toggle('favorited');
        showToastNotification(false, 'Error updating favorite status. Please try again.');
    });
}

function renderRecipes(recipes) {
    const recipesContainer = document.getElementById('recipes');
    recipesContainer.classList.add('recipe-container');
    
    recipes.forEach(recipe => {
        const li = document.createElement('li');
        li.classList.add('recipe-item');
        const recipeId = recipe.recipe.uri.split('#')[1];
        
        li.innerHTML = `
            <a href="/results/recipe/?recipe=${recipeId}">
                <h2>${recipe.recipe.label}</h2>
                <img src="${recipe.recipe.image}" alt="${recipe.recipe.label}" width="200">
                <p>Calories: ${Math.round(recipe.recipe.calories)}</p>
                <p>Cook time: ${recipe.recipe.totalTime > 0 ? recipe.recipe.totalTime + ' minutes' : 'Not specified'}</p>
                <p>Ingredients: ${recipe.recipe.ingredients.length}</p>
            </a>
            <a class="fav-button ${recipe.isFavorited ? 'favorited' : ''}" data-id="${recipeId}">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <path d="M20.205 4.791a5.938 5.938 0 0 0-4.209-1.754A5.906 5.906 0 0 0 12 4.595a5.904 5.904 0 0 0-3.996-1.558 5.942 5.942 0 0 0-4.213 1.758c-2.353 2.363-2.352 6.059.002 8.412L12 21.414l8.207-8.207c2.354-2.353 2.355-6.049-.002-8.416z"></path>
                </svg>
            </a>
        `;
        
        recipesContainer.appendChild(li);
        
        const favButton = li.querySelector('.fav-button');
        favButton.addEventListener('click', handleFavoriteClick);
    });
}

let currentIndex = 0;
let allRecipes = [];
const recipesPerPage = 10;

async function loadMore(nextPage) {
    try {
        if (currentIndex < allRecipes.length) {
            const nextRecipes = allRecipes.slice(currentIndex, currentIndex + recipesPerPage);
            renderRecipes(nextRecipes);
            currentIndex += recipesPerPage;
        } else if (nextPage) {
            const response = await fetch(nextPage);
            const data = await response.json();
            allRecipes = allRecipes.concat(data.hits);
            const nextRecipes = allRecipes.slice(currentIndex, currentIndex + recipesPerPage);
            renderRecipes(nextRecipes);
            currentIndex += recipesPerPage;
            
            if (data._links && data._links.next) {
                document.getElementById('load-more').setAttribute(
                    'onclick', 
                    `loadMore('/nextPage?url=${encodeURIComponent(data._links.next.href)}')`
                );
            } else {
                document.getElementById('load-more').style.display = 'none';
            }
        } else {
            document.getElementById('load-more').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading more recipes:', error);
        showToastNotification(false, 'Error loading more recipes. Please try again.');
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const button = dropdown.querySelector('.dropbtn');
        const content = dropdown.querySelector('.dropdown-content');
        
        button.addEventListener('click', () => {
            content.style.display = content.style.display === 'block' ? 'none' : 'block';
        });
        
        document.addEventListener('click', (event) => {
            if (!dropdown.contains(event.target)) {
                content.style.display = 'none';
            }
        });
    });

    const initialFavButtons = document.querySelectorAll('.fav-button');
    initialFavButtons.forEach(button => {
        button.addEventListener('click', handleFavoriteClick);
    });
});