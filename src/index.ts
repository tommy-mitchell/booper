import boopManager from "./boopManager";
import { BoopOptions, Transform } from "./boop";
export { ValueUpdater } from "./boop";

/** 
 * Watch the provided `boopElement` to trigger a 'boop' effect on it with the given `options`. If a 
 * `triggerElement` is provided, watches it instead and then triggers the 'boop' effect on the given
 * `boopElement`.
 */
export function newBoopElement(boopElement: Element, options: Partial<BoopOptions>, triggerElement?: Element): void
{
    const element = triggerElement ?? boopElement;
    boopManager.addBoop(element as HTMLElement, boopElement as HTMLElement, options);
}

/**
 * Search for any child elements on the given `triggerElement` with the class `boop`, and create
 * a `BoopElement` for it.
 */
function addBoops(triggerElement: Element, options: Partial<BoopOptions>): void
{
    const boopElements = triggerElement.querySelectorAll(".boop");

    if(boopElements.length > 0)
        boopElements.forEach(boopElement => newBoopElement(boopElement, options, triggerElement));
    else
        newBoopElement(triggerElement, options);
}

/**
 * Find all elements with the given class name and create 'boop' effects for them with the given
 * `options`, applying the effect on any child elements with the class `boop` if they exist.
 */
export function newBoopClass(className: string, options: Partial<BoopOptions>): void
{
    window.addEventListener("load", () => {
        // Applies 'boop' effect on the specified elements, defaulting to
        // the base element if none provided
        document.querySelectorAll(`.${className}`).forEach(element => addBoops(element, options));
    });
}

export function makeDefaultBoops()
{
    window.addEventListener("load", () => {
        /** An array of elements with transforms specified. */
        const boopElements: Element[] = [
            ...document.querySelectorAll(`[class*="boop-x-"]`),
            ...document.querySelectorAll(`[class*="boop-y-"]`),
            ...document.querySelectorAll(`[class*="boop-rotate-"]`),
            ...document.querySelectorAll(`[class*="boop-scale-"]`)
        ];

        boopElements.forEach(boopElement => {
            // Find the 'boop' class for the given element
            const boopClass: string = Array.from(boopElement.classList).filter(name => name.startsWith("boop"))[0];

            /** The indexes of any transform specified. */
            /*const transformIndexes: number[] = [
                boopClass.indexOf("x-"),
                boopClass.indexOf("y-"),
                boopClass.indexOf("rotate-"),
                boopClass.indexOf("scale-")
            ];*/

            /** The indexes of any transform specified. */
            const transformIndexes: { transformIndex: number, toValueOffset: number }[] = [
                { transformIndex: boopClass.indexOf("x-"),      toValueOffset: 2 },
                { transformIndex: boopClass.indexOf("y-"),      toValueOffset: 2 },
                { transformIndex: boopClass.indexOf("rotate-"), toValueOffset: 7 },
                { transformIndex: boopClass.indexOf("scale-"),  toValueOffset: 6 }
            ];

            let config: Partial<Transform> = {};

            // Parse the `boopClass` to create the options for the given element
            transformIndexes.forEach( ({ transformIndex, toValueOffset }) => {
                if(transformIndex !== -1)
                {
                    // "boop-x-10-rotate-50" -> "x, 10, rotate, 50"
                    /*const boopDetails: string[] = boopClass.substring(transformIndex).split('-');

                    const transform: string = boopDetails[0];
                    const toValue:   number = Number(boopDetails[1]);*/

                    const transform: string = boopClass.substring(transformIndex).split('-')[0];
                    const toValue:   number = Number(boopClass.substring(transformIndex + toValueOffset));

                    // { x: 10 }
                    config[transform] = toValue;
                }
            });

            // Create all `BoopElement`s if any transforms are parsed
            if(config !== {})
                addBoops(boopElement, config);
        });
    });
}

export default {
    newBoopClass:     newBoopClass,
    newBoopElement:   newBoopElement,
    makeDefaultBoops: makeDefaultBoops
}