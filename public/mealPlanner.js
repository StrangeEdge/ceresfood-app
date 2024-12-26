let currentDate = new Date();

function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    let weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    
    if (weekNumber === 53){
        weekNumber = 1;
    }
    return weekNumber;
}

function getWeekDates(date) {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        dates.push(day);
    }
    return dates;
}

function renderCalendar() {
    const weekDates = getWeekDates(currentDate);
    const startDate = weekDates[0];
    const endDate = weekDates[6];
    const weekNumber = getWeekNumber(startDate);
    
    document.getElementById('currentMonth').textContent = 
        `${startDate.toLocaleDateString('default', { month: 'long', day: 'numeric' })} - ${
            endDate.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })
        } (Week ${weekNumber})`;
    
    const calendar = document.getElementById('calendar');
    if (!calendar) return;
    
    calendar.innerHTML = `
        <div class="calendar-controls">
            <button class="button" onclick="previousWeek()">Previous Week</button>
            <button class="button current-week" onclick="jumpToCurrentWeek()">Current Week</button>
            <button class="button" onclick="nextWeek()">Next Week</button>
        </div>
        <div class="calendar-header">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div>
            <div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div class="calendar-days"></div>
    `;

    const daysContainer = calendar.querySelector('.calendar-days');
    let days = '';

    weekDates.forEach(date => {
        const isCurrentDay = isToday(date);
        days += `
            <div class="calendar-day ${isCurrentDay ? 'today' : ''}" 
                 onclick="selectDate('${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}')">
                <div class="day-number ${isCurrentDay ? 'today-number' : ''}">${date.getDate()}</div>
                <div class="day-meals" id="meals-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}"></div>
            </div>
        `;
    });

    daysContainer.innerHTML = days;
    
    loadMealPlans(startDate.getFullYear(), startDate.getMonth() + 1);
}

function previousWeek() {
    currentDate.setDate(currentDate.getDate() - 7);
    renderCalendar();
}

function nextWeek() {
    currentDate.setDate(currentDate.getDate() + 7);
    renderCalendar();
}

function jumpToCurrentWeek() {
    currentDate = new Date();
    renderCalendar();
}

async function selectDate(date) {
    const dateObj = new Date(date);
    document.getElementById('selectedDate').textContent = dateObj.toLocaleDateString();

    const mealSelector = document.getElementById('mealSelector');
    mealSelector.style.display = 'block';
    mealSelector.dataset.selectedDate = date;
    mealSelector.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

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
            throw new Error(data.error || 'Failed to load meal plans!');
        }
    } catch (error) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = `Error loading meal plans: ${error.message}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
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
            throw new Error(data.error || 'Failed to add meal!');
        }
    } catch (error) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = `Error adding meal: ${error.message}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
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
            throw new Error(data.error || 'Failed to delete meal!');
        }
    } catch (error) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = `Error deleting meal: ${error.message}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
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
