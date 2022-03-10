// Add info to accordion
const markdown = document.createRange().createContextualFragment(require("./about.md"));
document.querySelector("#accordion > #content").append(markdown);

// Open accordion on button click
const accordion = document.querySelector("#info") as HTMLElement;
accordion.querySelector("button").addEventListener("click", () => {
    accordion.classList.toggle("expand");
    (document.activeElement as HTMLElement).blur();
});

// Open/close modal on click
const modal    = document.querySelector("#modal-container") as HTMLElement;
const modalBtn = document.querySelector("#open-modal") as HTMLElement;
const modalBg  = document.querySelector("#modal-background") as HTMLElement;
modalBtn.addEventListener("click", () => modal.classList.add("show"));
modalBg.addEventListener("click", () => modal.classList.remove("show"));