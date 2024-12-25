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
});

const userDropdown = document.querySelector('.user-dropdown');
const dropdownMenu = userDropdown.querySelector('.dropdown-menu');
userDropdown.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdownMenu.classList.toggle('active');
});

document.addEventListener('click', function(e) {
    if (!userDropdown.contains(e.target)) {
        dropdownMenu.classList.remove('active');
    }
})

const categories = document.querySelectorAll('.recipe-categories a');

categories.forEach(category => {
    category.addEventListener('click', (event) => {
        event.preventDefault();
        const categoryId = event.target.closest('a').id;
        
        const healthLabelMapping = {
            'keto': 'keto-friendly',
            'gluten-free': 'gluten-free',
            'paleo': 'paleo',
            'pescatarian': 'pescatarian',
            'dairy-free': 'dairy-free',
            'low-sugar': 'low-sugar'
        };

        const healthLabel = healthLabelMapping[categoryId];

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/search';

        const healthInput = document.createElement('input');
        healthInput.type = 'hidden';
        healthInput.name = 'health';
        healthInput.value = healthLabel;

        form.appendChild(healthInput);
        document.body.appendChild(form);
        form.submit();
    });
});
function loadFromCache(img, recipeId) {
    const cachedUrl = localStorage.getItem(`recipe-image-${recipeId}`);
    if (cachedUrl) {
        img.src = cachedUrl;
    }
}

function handleImageError(img, recipeId) {
    if (!img.dataset.refreshAttempted) {
        img.dataset.refreshAttempted = 'true';
        
        fetch(`/recipe/refresh/${recipeId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.imageUrl) {
                    img.src = data.imageUrl;
                    localStorage.setItem(`recipe-image-${recipeId}`, data.imageUrl);
                } else {
                    img.src = '/default-recipe-image.jpg';
                }
            })
            .catch(error => {
                console.error('Error refreshing recipe image:', error);
                img.src = '/default-recipe-image.jpg';
            });
    }
}

const featuredImages = document.querySelectorAll('.featured-recipes img','favorite-recipes img');
featuredImages.forEach(img => {
    const recipeId = img.closest('a').dataset.recipeId;
    loadFromCache(img, recipeId);
    img.onerror = () => handleImageError(img, recipeId);
});