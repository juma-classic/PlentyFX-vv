const title = document.querySelector('.title');
const colors = ['orange', 'red', 'blue', 'green'];
let currentColorIndex = 0;

function changeColor() {
    currentColorIndex = (currentColorIndex + 1) % colors.length;
    title.style.color = colors[currentColorIndex];
}

// Change color every 2 seconds
setInterval(changeColor, 2000);