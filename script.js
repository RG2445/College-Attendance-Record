let isStudent = true;
function toggleRole() {
    const toggleSlider = document.querySelector(".toggle-slider");
    isStudent = !isStudent;
    toggleSlider.style.transform = isStudent ? "translateX(0%)" : "translateX(100%)";
}