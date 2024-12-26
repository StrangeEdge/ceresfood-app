async function addIngredient() {
    const name = document.getElementById('ingredientInput').value.trim();
    const amount = document.getElementById('quantityInput').value;
    const unit = document.getElementById('unitSelect').value;

    if (!name || !amount) {
        showToast('Please enter both ingredient name and quantity', 'error');
        return;
    }

    try {
        const response = await fetch('/pantry/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, amount, unit })
        });

        const data = await response.json();

        if (response.ok) {
            location.reload();
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to add ingredient', 'error');
    }
}

function showToast(message, type = 'success') {
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'error' ? '⚠️' : '';

    let content = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;

    if (type === 'confirm') {
        content += `
            <div class="toast-actions">
                <button class="button confirm-yes">Yes</button>
                <button class="button confirm-no">No</button>
            </div>
        `;
    }
    
    toast.innerHTML = content;
    document.body.appendChild(toast);

    if (type === 'confirm') {
        toast.querySelector('.confirm-yes').addEventListener('click', () => {
            toast.remove();
            if (onConfirm) onConfirm();
        });
        toast.querySelector('.confirm-no').addEventListener('click', () => {
            toast.remove();
            if (onCancel) onCancel();
        });
    } else {
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}


function editIngredient(button) {
    const card = button.closest('.ingredient-card');
    const quantitySpan = card.querySelector('.quantity');
    const unitSpan = card.querySelector('.unit');

    const currentQuantity = quantitySpan.textContent;
    const currentUnit = unitSpan.textContent;
    
    quantitySpan.innerHTML = `
        <input type="number" value="${currentQuantity}" min="0" step="0.1">
    `;
    
    unitSpan.innerHTML = `
        <select>
            <option value="g" ${currentUnit === 'g' ? 'selected' : ''}>g</option>
            <option value="kg" ${currentUnit === 'kg' ? 'selected' : ''}>kg</option>
            <option value="mg" ${currentUnit === 'mg' ? 'selected' : ''}>mg</option>
            <option value="L" ${currentUnit === 'L' ? 'selected' : ''}>L</option>
            <option value="mL" ${currentUnit === 'mL' ? 'selected' : ''}>mL</option>
        </select>
    `;

    button.textContent = 'Save';
    button.onclick = () => saveIngredient(card);
}

async function saveIngredient(card) {
    const id = card.dataset.id;
    const newAmount = card.querySelector('.quantity input').value;
    const newUnit = card.querySelector('.unit select').value;

    try {
        const response = await fetch('/pantry/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id,
                amount: newAmount,
                unit: newUnit
            })
        });

        if (response.ok) {
            location.reload();
        } else {
            showToast(data.error, 'Failed to update ingredient!');
        }
    } catch (error) {
        showToast('Failed to update ingredient','error');
    }
}

async function deleteIngredient(button) {
    const card = button.closest('.ingredient-card');
    const id = card.dataset.id;

    try {
        const response = await fetch(`/pantry/delete/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Ingredient deleted!')
            card.remove();
        } else {
            throw new Error(data.error||'Failed to delete ingredient');
        }
    } catch (error) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = `Failed to delete ingredient: ${error.message}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}