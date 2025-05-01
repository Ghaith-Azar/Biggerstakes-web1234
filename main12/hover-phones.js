document.addEventListener("DOMContentLoaded", () => {
    let isScrolling = false;

    // Detect scrolling
    document.addEventListener("scroll", () => {
        isScrolling = true;
        setTimeout(() => (isScrolling = false), 200); // Reset after scrolling stops
    });

    // Add touchstart event listener to all elements
    document.querySelectorAll("*").forEach((element) => {
        element.addEventListener("touchstart", () => {
            if (isScrolling) {
                element.classList.add("hover-effect");

                // Remove the hover-effect class after a short delay
                setTimeout(() => element.classList.remove("hover-effect"), 500);
            }
        });
    });
});
