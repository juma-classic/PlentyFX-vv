let menu = document.querySelector('#menu-icon');
let sidenavbar = document.querySelector('.side-navbar');
let content = document.querySelector('.content');

menu.onclick = () => {
    sidenavbar.classList.toggle('active');
    content.classList.toggle('active');
}


const closeIcon = document.getElementById('close-icon');
closeIcon.addEventListener('click', () => {
    sidenavbar.classList.remove('active');
    content.classList.remove('active');
});


function navigateTo(url) {
    window.location.href = url;
}