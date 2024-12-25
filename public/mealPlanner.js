let currentDate = new Date();

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    document.getElementById('currentMonth').textContent = 
        new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
    
    const calendar = document.getElementById('calendar');
    if (!calendar) return;
    
    calendar.innerHTML = `
        <div class="calendar-header">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div>
            <div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div class="calendar-days"></div>
    `;

    const daysContainer = calendar.querySelector('.calendar-days');
    let days = '';
    
    for (let i = 0; i < firstDay.getDay(); i++) {
        days += '<div class="calendar-day empty"></div>';
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
        days += `
            <div class="calendar-day" onclick="selectDate('${year}-${month + 1}-${day}')">
                <div class="day-number">${day}</div>
                <div class="day-meals" id="meals-${year}-${month + 1}-${day}"></div>
            </div>
        `;
    }

    daysContainer.innerHTML = days;
    loadMealPlans(year, month + 1);
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

async function loadMealPlans(year, month) {
    try {
        console.log(`Loading meal plans for ${year}-${month}`);
        const response = await fetch(`/meal-planner/${year}/${month}`);
        const data = await response.json();
        console.log('Received meal plans:', data);
        
        if (data.success && data.mealPlans) {
            data.mealPlans.forEach(plan => {
                const date = new Date(plan.date);
                const dayElement = document.getElementById(
                    `meals-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
                );
                
                if (dayElement) {
                    const mealsList = plan.meals.map(meal => 
                        `<div class="meal ${meal.mealType}">${meal.recipeLabel}</div>`
                    ).join('');
                    dayElement.innerHTML = mealsList;
                }
            });
        } else {
            console.error('Failed to load meal plans:', data.error);
        }
    } catch (error) {
        console.error('Error loading meal plans:', error);
    }
}

async function selectDate(date) {
    const dateObj = new Date(date);
    document.getElementById('selectedDate').textContent = dateObj.toLocaleDateString();
    document.getElementById('mealSelector').style.display = 'block';
    document.getElementById('mealSelector').dataset.selectedDate = date;

    try {
        const response = await fetch(`/meal-planner/${dateObj.getFullYear()}/${dateObj.getMonth() + 1}`);
        const data = await response.json();
        
        if (data.success && data.mealPlans) {
            const dayPlan = data.mealPlans.find(plan => 
                new Date(plan.date).toDateString() === dateObj.toDateString()
            );

            const existingMealsDiv = document.getElementById('existingMeals');
            existingMealsDiv.innerHTML = '';
            let totalCalories = 0;

            if (dayPlan && dayPlan.meals.length > 0) {
                dayPlan.meals.forEach(meal => {
                    const mealDiv = document.createElement('div');
                    mealDiv.className = `existing-meal ${meal.mealType}`;
                    mealDiv.innerHTML = `
                        <div class="meal-info">
                            <span class="meal-type">${meal.mealType}</span>
                            <span class="meal-name">${meal.recipeLabel}</span>
                            <span class="meal-calories">${meal.recipeCalories  || 0} cal</span>
                        </div>
                        <button onclick="deleteMeal('${date}', '${meal.mealType}')" class="delete-meal">×</button>
                    `;
                    existingMealsDiv.appendChild(mealDiv);
                    totalCalories += meal.recipeCalories || 0;
                });
            }

            document.getElementById('totalCalories').textContent = Math.round(totalCalories);
        }
    } catch (error) {
        console.error('Error loading meals for date:', error);
    }
}

function selectRecipe(recipeCard) {
    document.querySelectorAll('.recipe-card').forEach(card => {
        card.classList.remove('selected');
    });
    recipeCard.classList.add('selected');
}

async function addMeal() {
    const date = document.getElementById('mealSelector').dataset.selectedDate;
    const mealType = document.getElementById('mealType').value;
    const selectedRecipe = document.querySelector('.recipe-card.selected');

    if (!selectedRecipe) {
        alert('Please select a recipe first');
        return;
    }

    try {
        const response = await fetch('/meal-planner/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: date,
                recipeId: selectedRecipe.dataset.recipeId,
                recipeLabel: selectedRecipe.dataset.recipeLabel,
                recipeImage: selectedRecipe.dataset.recipeImage,
                recipeCalories: parseInt(selectedRecipe.dataset.recipeCalories) || 0,
                mealType: mealType
            })
        });

        const data = await response.json();
        if (data.success) {
            const dateObj = new Date(date);
            loadMealPlans(dateObj.getFullYear(), dateObj.getMonth() + 1);
            document.getElementById('mealSelector').style.display = 'none';
            
            const toast = document.createElement('div');
            toast.className = 'toast success';
            toast.textContent = 'Meal added successfully!';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } else {
            alert('Failed to add meal: ' + data.error);
        }
    } catch (error) {
        console.error('Error adding meal:', error);
        alert('Failed to add meal');
    }
}

async function deleteMeal(date, mealType) {
    try {
        const response = await fetch(`/meal-planner/${date}/${mealType}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (data.success) {
            const dateObj = new Date(date);
            const dayElement = document.getElementById(
                `meals-${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}`
            );
            if (dayElement) {
                const mealElement = dayElement.querySelector(`.meal.${mealType}`);
                if (mealElement) {
                    mealElement.remove();
                }
            }
            
            loadMealPlans(dateObj.getFullYear(), dateObj.getMonth() + 1);
            selectDate(date);

            const toast = document.createElement('div');
            toast.className = 'toast success';
            toast.textContent = 'Meal deleted successfully!';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } else {
            alert('Failed to delete meal: ' + data.error);
        }
    } catch (error) {
        console.error('Error deleting meal:', error);
        alert('Failed to delete meal');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.recipe-card').forEach(card => {
        card.addEventListener('click', () => selectRecipe(card));
    });

    renderCalendar();

    const mealSelector = document.getElementById('mealSelector');
    if (!mealSelector.querySelector('button')) {
        const addButton = document.createElement('button');
        addButton.textContent = 'Add Meal';
        addButton.onclick = addMeal;
        addButton.classList.add('button');
        mealSelector.appendChild(addButton);
    }
});
