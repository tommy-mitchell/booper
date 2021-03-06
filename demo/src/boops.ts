import { newBoopClass, newBoopElement, ValueUpdater, makeDefaultBoops } from "booper/dist";

makeDefaultBoops();

// Custom value updater
const rotateAwayFromMouse: ValueUpdater = ({ options }, event) => {
    ((event: MouseEvent) => {
        const rect = (event.target as Element).getBoundingClientRect();
        const xPos = event.clientX - rect.left;

        // Rotate left/right depending on mouse position over the element
        const direction = xPos < (rect.width / 2) ? 1 : -1;

        options.rotate = Math.abs(options.rotate) * direction;
    })(event as MouseEvent);
}

// Create 'boop' effects
newBoopClass("boop-scale",  { scale: 2, rotate: 50, valueUpdater: rotateAwayFromMouse });
newBoopClass("boop-rotate", { rotate: 30 });
newBoopClass("boop-transX", { x: 75, timeout: 50, springConfig: { stiffness: 500, damping: 20 } });
newBoopClass("boop-square", { y: 20, rotate: 40, valueUpdater: rotateAwayFromMouse, events: ["mouseenter", "click"] });
newBoopClass("boop-button", { y: 5 }); // TODO: start on enter/click; mousedown, end on mouseup/leave (once: true)

function lerp(number: number, currentScaleMin: number, currentScaleMax: number, newScaleMin: number, newScaleMax: number): number
{
    // Normalize between 0 and 1
    const standardNormalization = (number - currentScaleMin) / (currentScaleMax - currentScaleMin);
    // Transpose value to desired scale
    return ((newScaleMax - newScaleMin) * standardNormalization + newScaleMin);
}

const starTrigger = document.querySelector(".star svg") as HTMLElement;
const circles  = starTrigger.parentElement.querySelectorAll(".circle");
const distance = 42;

for(let index = 0; index < 5; index++)
{
    const angle       = index * (360/5) - 90;
    const angleInRads = (angle * 3.14) / 180;

    const x = distance * Math.cos(angleInRads);
    const y = distance * Math.sin(angleInRads);

    //console.log(angle, angleInRads, x, ((x / distance )* 180 / 3.14))

    let timing = lerp(index, 0, 4, 450, 600);
    timing    *= 1 + (index * .11); // .22

    //const friction = lerp(index, 0, 4, 15, 40);
    //console.log(friction);

    newBoopElement(circles[index], {
        x: x,
        y: y,
        timeout: timing,
        //scale: 1.4,
        springConfig: {
            stiffness: 180,
            damping:   15//friction
        }
    }, starTrigger);
}