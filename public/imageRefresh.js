const imageUtils = {
    loadFromCache: function(img, recipeId) {
        const cachedUrl = localStorage.getItem(`recipe-image-${recipeId}`);
        if (cachedUrl) {
            img.src = cachedUrl;
        }
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
    }
};

document.addEventListener('DOMContentLoaded', () => {
    imageUtils.loadImage();
});