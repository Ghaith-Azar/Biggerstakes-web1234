window.addEventListener('scroll',reveal);

function reveal(){
    var reveals = document.querySelectorAll('.reveal');
    
    for(var i=0; i < reveals.length; i++){

        var windowheight = window.innerHeight;
        var revealtop = reveals[i].getBoundingClientRect().top;
        var revealpoint = 150;
        if(revealtop < windowheight - revealpoint){
            reveals[i].classList.add('active');
        }
        else{
            reveals[i].classList.remove('active');
        }
    }
}






window.addEventListener('scroll',reveal1);

function reveal1(){
    var reveals = document.querySelectorAll('.reveal1');
    
    for(var i=0; i < reveals.length; i++){

        var windowheight = window.innerHeight;
        var revealtop = reveals[i].getBoundingClientRect().top;
        var revealpoint = 150;
        if(revealtop < windowheight - revealpoint){
            reveals[i].classList.add('active');
        }
        else{
            reveals[i].classList.remove('active');
        }
    }
}






window.addEventListener('scroll',reveal2);
    
function reveal2(){
    var reveals = document.querySelectorAll('.reveal2');
    
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






window.addEventListener('scroll',reveal3);

function reveal3(){
    var reveals = document.querySelectorAll('.reveal3');
    
    for(var i=0; i < reveals.length; i++){

        var windowheight = window.innerHeight;
        var revealtop = reveals[i].getBoundingClientRect().top;
        var revealpoint = 150;
        if(revealtop < windowheight - revealpoint){
            reveals[i].classList.add('active');
        }
        else{
            reveals[i].classList.remove('active');
        }
    }
}






window.addEventListener('scroll',reveal4);

function reveal4(){
    var reveals = document.querySelectorAll('.reveal4');
    
    for(var i=0; i < reveals.length; i++){

        var windowheight = window.innerHeight;
        var revealtop = reveals[i].getBoundingClientRect().top;
        var revealpoint = 150;
        if(revealtop < windowheight - revealpoint){
            reveals[i].classList.add('active');
        }
        else{
            reveals[i].classList.remove('active');
        }
    }
}



