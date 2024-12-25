const toggleButton = document.getElementById('toggle-btn')

function toggleSidebar(){
    sidebar.classList.toggle('close')
    toggleButton.classList.toggle('rotate')
}

document.addEventListener('DOMContentLoaded');
