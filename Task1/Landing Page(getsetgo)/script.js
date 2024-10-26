const scrollBar = document.querySelector("#scroll");
const displayContent = document.querySelector("#display");

displayContent.addEventListener("click", () => {
  scrollBar.classList.toggle("active");
  displayContent.classList.toggle("active");
});
