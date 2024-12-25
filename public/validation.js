const form = document.getElementById('form');
const inputs = Array.from(form.querySelectorAll('input')).filter(input => input != null);

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const endpoint = form.getAttribute('action');
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(Object.fromEntries(formData))
        });

        const data = await response.json();
        
        if (!response.ok) {
            let error_message = document.querySelector('.error-message');
            if (!error_message) {
                error_message = document.createElement('p');
                error_message.classList.add('error-message');
                form.insertBefore(error_message, form.firstChild);
            }
            
            error_message.innerText = data.error;
            
            inputs.forEach(input => input.parentElement.classList.remove('incorrect'));
            
            if (data.field === 'both') {
                inputs.forEach(input => input.parentElement.classList.add('incorrect'));
            } else if (data.field) {
                const errorInput = document.getElementById(`${data.field}-input`);
                if (errorInput) {
                    errorInput.parentElement.classList.add('incorrect');
                }
            }
        } else {
            window.location.href = endpoint === '/login' ? '/ceres' : '/login';
        }
    } catch (error) {
        console.error(`${endpoint} error:`, error);
    }
});

inputs.forEach(input => {
    input.addEventListener('input', () => {
        if(input.parentElement.classList.contains('incorrect')){
            input.parentElement.classList.remove('incorrect');
            
            const error_message = document.querySelector('.error-message');
            if(error_message) error_message.innerText = '';
        }
    });
});
