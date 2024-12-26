const imageUtils = {
    loadFromCache: function(img, recipeId) {
        const cachedUrl = localStorage.getItem(`recipe-image-${recipeId}`);
        if (cachedUrl) {
            img.src = cachedUrl;
        }
    },

    preloadFeaturedImages: function() {
        const featuredImages = document.querySelectorAll('.featured-recipes a');
        featuredImages.forEach(link => {
            const recipeId = link.dataset.recipeId;
            const img = link.querySelector('img');
            
            if (recipeId && img) {
                if (!this.loadFromCache(img, recipeId)) {
                    fetch(`/recipe/refresh/${recipeId}`)
                        .then(response => response.json())
                        .then(data => {
                            if (data.success && data.imageUrl) {
                                img.src = data.imageUrl;
                                localStorage.setItem(`recipe-image-${recipeId}`, data.imageUrl);
                            }
                        })
                        .catch(error => console.error('Error preloading image:', error));
                }
            }
        });
    },

    handleImageError: function(img, recipeId) {
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
    },

    loadImage: function() {
        this.preloadFeaturedImages();
        
        const featuredImages = document.querySelectorAll('.featured-recipes img');
        featuredImages.forEach(img => {
            const recipeId = img.closest('a').dataset.recipeId;
            this.loadFromCache(img, recipeId);
            img.onerror = () => this.handleImageError(img, recipeId);
        });

        const favoriteImages = document.querySelectorAll('.favorite-recipes .recipe-item img');
        favoriteImages.forEach(img => {
            const recipeLink = img.closest('a');
            if (recipeLink && recipeLink.href.includes('recipe=')) {
                const recipeId = recipeLink.href.split('recipe=')[1];
                this.loadFromCache(img, recipeId);
                img.onerror = () => this.handleImageError(img, recipeId);
            }
        });
        
        const savedRecipeImages = document.querySelectorAll('.meal-selector .recipe-card-image img');
        savedRecipeImages.forEach(img =>{
            const recipeCard = img.closest('.recipe-card');
            if (recipeCard) {
                const recipeId = recipeCard.dataset.recipeId;
                this.loadFromCache(img, recipeId);
                img.onerror = () => this.handleImageError(img, recipeId);
            }
        })
    }
};

document.addEventListener('DOMContentLoaded', () => {
    imageUtils.loadImage();
});