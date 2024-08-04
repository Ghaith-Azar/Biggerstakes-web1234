document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault();
    alert('Form submitted!');
});


const features = document.querySelectorAll('.feature');

features.forEach(feature => {
    feature.addEventListener('mouseenter', () => {
        feature.classList.add('active');
    });

    feature.addEventListener('mouseleave', () => {
        feature.classList.remove('active');
    });
});



document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');

    menuToggle.addEventListener('click', function () {
        menu.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
});















window.addEventListener('scroll',reveal);

function reveal(){
    var reveals = document.querySelectorAll('.reveal');
    
    for(var i=0; i < reveals.length; i++){

        var windowheight = window.innerHeight;
        var revealtop = reveals[i].getBoundingClientRect().top;
        var revealpoint=150;
        if(revealtop < windowheight - revealpoint){
            reveals[i].classList.add('active');
        }
        else{
            reveals[i].classList.remove('active');

        }
    }

}

