// Get the button
var scrollToTopBtn = document.getElementById("scrollToTopBtn");

// When the user scrolls down 1200px from the top of the document, show the button
window.onscroll = function() {
    if (document.body.scrollTop > 1200 || document.documentElement.scrollTop > 1200) {
        scrollToTopBtn.style.display = "block";
    } else {
        scrollToTopBtn.style.display = "none";
    }
};

// When the user clicks on the button, scroll to the top of the document
scrollToTopBtn.onclick = function() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
};



/*
The Html code for it is of the following format 

    <button id="scrollToTopBtn" title="Scroll to top">&#11014;</button>

*/
