function showToast({ message, type = 'info', duration = 3000, isConfirmation = false }) {
    return new Promise((resolve) => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        if (isConfirmation) {
            toast.innerHTML = `
                <div class="toast-message">${message}</div>
                <div class="toast-actions">
                    <button class="confirm-btn">Delete</button>
                    <button class="cancel-btn">Cancel</button>
                </div>
            `;
        } else {
            toast.innerHTML = `
                <div class="checkmark">✓</div>
                <div class="toast-message">${message}</div>
            `;
        }
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        if (isConfirmation) {
            const confirmBtn = toast.querySelector('.confirm-btn');
            const cancelBtn = toast.querySelector('.cancel-btn');
            
            confirmBtn.addEventListener('click', () => {
                hideToast(toast);
                resolve(true);
            });
            
            cancelBtn.addEventListener('click', () => {
                hideToast(toast);
                resolve(false);
            });
        } else {
            setTimeout(() => {
                hideToast(toast);
                resolve(true);
            }, duration);
        }
    });
}

function hideToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
        toast.remove();
    }, 300);
}

async function deleteRecipe(recipeId) {
    const confirmed = await showToast({
        message: 'Are you sure you want to delete this recipe?',
        type: 'warning',
        isConfirmation: true
    });
    
    if (!confirmed) {
        return;
    }
    
    try {
        const response = await fetch(`/favorite/delete/${recipeId}`, {
            method: 'DELETE',
        });
        
        if (response.ok) {
            const recipeItem = document.querySelector(`li[data-recipe-id="${recipeId}"]`);
            if (recipeItem) {
                recipeItem.remove();
            }
            
            await showToast({
                message: 'Recipe deleted successfully',
                type: 'success',
                duration: 2000
            });
        } else {
            throw new Error('Failed to delete recipe');
        }
    } catch (error) {
        console.error('Error deleting recipe:', error);
        await showToast({
            message: 'Failed to delete recipe',
            type: 'error',
            duration: 3000
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    function handleImageError(img, recipeId) {
        
        if (!img.dataset.refreshAttempted) {
            img.dataset.refreshAttempted = 'true';
            
            fetch(`/recipe/refresh/${recipeId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.imageUrl) {
                        img.src = data.imageUrl;
                    } else {
                        
                    }
                })
                .catch(error => {
                    console.error('Error refreshing recipe image:', error);
                    img.src = '/default-recipe-image.jpg';
                });
        }
    }

    const recipeImages = document.querySelectorAll('.recipe-image img');
    recipeImages.forEach(img => {
        const recipeId = img.closest('.recipe-item').dataset.recipeId;
        img.onerror = () => handleImageError(img, recipeId);
    });
});
