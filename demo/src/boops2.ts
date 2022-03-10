import { newBoopClass, newBoopElement, BoopDetails } from "../../old/index multi";

// Custom value updater
const rotateAwayFromMouse = {
    willUpdate: true,
    handler: (details: BoopDetails, event: Event) => {
        const direction = (event as MouseEvent).offsetX < 50 ? 1 : -1;

        details.options.rotation = Math.abs(details.options.rotation) * direction;
    }
}

// Create 'boop' effects
newBoopClass("boop-scale",  { scale: 2, rotation: 50});//, valueUpdater: rotateAwayFromMouse });
newBoopClass("boop-transY", { y: 25 });
newBoopClass("boop-rotate", { rotation: 30 });
newBoopClass("boop-transX", { x: 75, timeout: 50, springConfig: { stiffness: 500, damping: 20 } });
newBoopClass("boop-square", { y: 20, rotation: 40, valueUpdater: rotateAwayFromMouse });
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
    const angleInRads = (angle * Math.PI) / 180;

    const x = distance * Math.cos(angleInRads);
    const y = distance * Math.sin(angleInRads);

    let timing = lerp(index, 0, 4, 450, 600);
    timing    *= 1 + index * .22;

    const friction = lerp(index, 0, 4, 15, 40);

    newBoopElement(circles[index], {
        x: x,
        y: y,
        timeout: timing,
        scale: 1.4,
        springConfig: {
            stiffness: 180,
            damping:   friction
        }
    }, starTrigger);
}