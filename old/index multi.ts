import { Spring, PartialSpringConfig } from "wobble";
import { Enum } from 'enum-keys-values-entries';

type EventCondition = (details: BoopDetails, event: Event) => Boolean;
type StopCondition  = (handler: () => void) => void;
type ValueUpdater   = (details: BoopDetails, event: Event) => void;

interface BoopOptions {
    x:             number; // the 'toValue' to translate to on the X axis (default: `0px`)
    y:             number; // the 'toValue' to translate to on the Y axis (default: `0px`)
    rotation:      number; // the 'toValue' to rotate towards (default: `0deg`)
    scale:         number; // the 'toValue' to scale to (default: `1`)
    timeout:       number; // the timeout for the default end callback (default: `150ms`)
    endCallback:   StopCondition; // the callback that fires at the end of the boop (default: `SetTimeout(handler, timeout))`)
    springConfig?: PartialSpringConfig; // any parameters for the spring (default: `{ stiffness: 300, damping: 10 }`)
    events: {
        readonly [index: string]: EventCondition;
    }
    valueUpdater: {
        willUpdate: Boolean;
        handler:    ValueUpdater;
    }
    [index: string]: any;
}

enum Transform {
    TranslateX = "x",
    TranslateY = "y",
    Rotate     = "rotation",
    Scale      = "scale"
}

enum Matrix {
    ScaleX     = "a",
    SkewY      = "b",
    SkewX      = "c",
    ScaleY     = "d",
    TranslateX = "e",
    TranslateY = "f"
}

type TransformFunction = (value: number) => string;

interface Point {
    x: number;
    y: number;
}

type TriggerElement = HTMLElement;

interface BoopElement {
    element:  HTMLElement;
    options:  BoopOptions;
    transforms: Map<Transform, {
        spring: Spring;
        value:  number;
        hasReset: Boolean;
    }>;
    currentTransform: string;
    isBooped: Boolean;
    hasReset: Boolean;
    initialMousePos: Point | undefined;
}

export interface BoopDetails {
             options:         BoopOptions;
    readonly isBooped:        Boolean;
    readonly initialMousePos: Point | undefined;
}

class BoopManager
{
    private static DefaultBoopOptions: BoopOptions = {
        x:        0,
        y:        0,
        rotation: 0,
        scale:    1,
        timeout:  150,
        // The default `endCallback` is a simple timeout using the default
        // `timeout` value
        endCallback: handler => setTimeout(handler, BoopManager.DefaultBoopOptions.timeout), // TODO: get instance timeout
        springConfig: {
            requestAnimationFrame: false,
            stiffness: 300,
            damping:   10
        },
        events: {
            // The default 'boop' effect triggers on `mouseenter` of the
            // `baseElement`.  The effect has a chance of moving off the
            // cursor while animating and retriggering itself when
            // returning to its starting position. This conditional checks
            // that the cursor has moved a significant enough distance
            // between `mouseenter`s before allowing the 'boop' to trigger
            ['mouseenter']: (details: BoopDetails, event: Event) => {
                if(details.initialMousePos === undefined)
                    return true;

                // Can't boop if mouse has barely moved (no accidental double booping)
                return (Math.abs(details.initialMousePos.x - (event as MouseEvent).screenX) > 15) ||
                       (Math.abs(details.initialMousePos.y - (event as MouseEvent).screenY) > 15);
            }
        },
        // The default 'boop' effect does not change its `toValue`
        valueUpdater: {
            willUpdate: false,
            handler:   (details: BoopDetails, event: Event) => {}
        }
    }

    private static TransformMap = new Map<Transform, TransformFunction>([
        [ Transform.TranslateX, value => `translateX(${value}px) ` ],
        [ Transform.TranslateY, value => `translateY(${value}px) ` ],
        [ Transform.Rotate,     value =>     `rotate(${value}deg) `],
        [ Transform.Scale,      value =>      `scale(${value}) `   ]
    ]);

    private triggerElements: Map<TriggerElement, BoopElement[]> = new Map<TriggerElement, BoopElement[]>();
    // A count of how many springs are currently active
    // When > 0, the simulation is running
    private activeSprings = 0;
    private isAnimating = false;

    /**
     * Simulates every active spring at a concurrent timestep, using one `requestAnimationFrame()` call.
     */
    private simulate()
    {
        // Stop simulation if no springs are currently active
        if(this.activeSprings === 0)
        {
            this.isAnimating = false;
            return;
        }

        const time = Date.now();

        this.triggerElements.forEach(boopElements => {
            boopElements.forEach(boopElement => {
                boopElement.currentTransform = "";

                // Simulate each spring for this 'boop' effect
                boopElement.transforms.forEach(transform => {
                    if(!transform.spring.isAtRest)
                        transform.spring.step(time);
                });
    
                // Apply transformations from this step to the `boopElement`
                boopElement.element.style.transform = boopElement.currentTransform;
            });
        });

        // Continue simulation loop, binding with current context
        requestAnimationFrame(this.simulate.bind(this));
    }

    private parseTransforms(boopElement: BoopElement): void
    {
        // https://stackoverflow.com/a/53767493/10292952
        // instead of "translate"/"scale"/etc, just set the matrix
        Enum.values<Transform>(Transform).forEach(transform => {
            if(boopElement.options[transform] !== BoopManager.DefaultBoopOptions[transform])
            {
                const potentialCurrent = boopElement.transforms.get(transform);

                if(potentialCurrent)
                {
                    potentialCurrent.value = boopElement.options[transform];
                    boopElement.transforms.set(transform, potentialCurrent);
                }
                else
                {
                    if(transform === Transform.Scale)
                        boopElement.options.springConfig!.fromValue = 1;

                    boopElement.transforms.set(transform, {
                        spring: new Spring(boopElement.options.springConfig),
                        value:  boopElement.options[transform],
                        hasReset: false
                    });
                }
            }
        });
    }

    private createBoopElement(boopElement: HTMLElement, options: BoopOptions): BoopElement
    {
        const newBoopDetails: BoopElement = {
            element:          boopElement,
            options:          options,
            transforms:       new Map(),
            currentTransform: "",
            isBooped:         false,
            hasReset:         false,
            initialMousePos:  undefined
        };

        if(options.timeout !== BoopManager.DefaultBoopOptions.timeout)
            newBoopDetails.options.endCallback = handler => setTimeout(handler, options.timeout);

        // Iteratively parse applicable toValues
        this.parseTransforms(newBoopDetails);
        
        newBoopDetails.transforms.forEach( (pair, transform) => {
            const spring: Spring = pair.spring;
            const reset = transform === Transform.Scale ? 1 : 0;

            spring.onUpdate(s => {
                if(!pair.hasReset && !newBoopDetails.isBooped)
                {
                    console.log("reset: ", transform, spring.currentValue, newBoopDetails.transforms)
                    pair.hasReset = true;
                    spring.setToValue(reset);
                }

                // TODO: matrix transforms
                newBoopDetails.currentTransform += BoopManager.TransformMap.get(transform)!(s.currentValue);
            }).onStop(() => {
                // Reset applied transformations
                //newBoopDetails.element.style.transform = '';
                newBoopDetails.initialMousePos = undefined;

// TODO: independent spring handling per boop element
                // Tell simulation that this spring is inactive
                this.activeSprings--;
                console.log("end: ", transform, spring)
            });
        });

        return newBoopDetails;
    }

    private addElement(triggerElement: HTMLElement, boopElement: HTMLElement, options: BoopOptions)
    {
        const newBoopElement = this.createBoopElement(boopElement, options);
        const possibleList   = this.triggerElements.get(triggerElement);

        if(possibleList)
            possibleList.push(newBoopElement);
        else
            this.triggerElements.set(triggerElement, [newBoopElement]);
    }

    private doBoop(boopElement: BoopElement): void
    {
        // Start 'boop' if not already started
        if(!boopElement.isBooped)
        {
            boopElement.isBooped = true;

            boopElement.element.style.transform = '';
            //boopElement.hasReset = false;

            boopElement.transforms.forEach(transform => {
                const spring: Spring = transform.spring;
                const toValue: number = transform.value;
                transform.hasReset = false;
                
                spring.setToValue(toValue).start();
                this.activeSprings++;
            });

            // When the provided `endCallback` fires,
            // end the 'boop' effect
            boopElement.options.endCallback(() => {
                boopElement.isBooped = false;
            });

            // Resume spring simulation if none were active
            if(!this.isAnimating)
            {
                this.isAnimating = true;
                this.simulate();
            }
        }
    }

    private boopHandler(event: Event): void
    {
        const element = event.target as HTMLElement;

        this.triggerElements.get(element)?.forEach(boopElement => {
            const conditional = boopElement.options.events[event.type].bind(this);

            if(conditional(boopElement, event))
            {
                if(event instanceof MouseEvent)
                    boopElement.initialMousePos = { x: event.screenX, y: event.screenY };
    
                if(boopElement.options.valueUpdater.willUpdate)
                {
                    boopElement.options.valueUpdater.handler(boopElement, event);
    
                    this.parseTransforms(boopElement);
                }
    
                this.doBoop(boopElement);
            }
        });
    }

    /**
     * Adds a given element to the Boop Manager, waiting for a trigger on the `baseElement` and applying the
     * 'boop' effect to the `boopElement`. Returns true if the element was added, false otherwise.
     */
    addBoop(triggerElement: HTMLElement, boopElement: HTMLElement, options: Partial<BoopOptions> = BoopManager.DefaultBoopOptions): Boolean
    {
        if(!triggerElement || !boopElement)
            return false;

        // Override the default options with any provided options
        const optionsWithFallbacks: BoopOptions = { ...BoopManager.DefaultBoopOptions, ...options };

        // Override spring config (was failing to include raf)
        optionsWithFallbacks.springConfig = { ...BoopManager.DefaultBoopOptions.springConfig, ...options.springConfig };

        // Track element, parse options, create springs
        this.addElement(triggerElement, boopElement, optionsWithFallbacks);

        // Register provided event handlers for booping
        Object.keys(optionsWithFallbacks.events).forEach(event => {
            // Trigger 'boop' effect on the base element, binding the class
            // instance context to the event handler
            triggerElement.addEventListener(event, this.boopHandler.bind(this));
        });

        return true;
    }

    removeBoop(element: HTMLElement): Boolean
    {
        /*if(!this.triggerElements.has(element))
            return false;
// TODO: remove event listener on element
        const details = this.triggerElements.get(element) as HTMLTriggerElement;
        details.transforms.forEach(transform => {
            transform.spring.removeAllListeners().stop();
        });

        this.triggerElements.delete(element);*/

        return true;
    }
}

export const boopManager: BoopManager = new BoopManager();

export function newBoopClass(className: string, options: Partial<BoopOptions>): void
{
    window.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll(`.${className}`).forEach(element => {
            // Applies 'boop' effect on the specified element, defaulting to
            // the base element if none provided
            const boopElement = element.querySelector(".boop") ?? element;

            boopManager.addBoop(element as HTMLElement, boopElement as HTMLElement, options);
        });
    });
}

export function newBoopElement(boopElement: Element, options: Partial<BoopOptions>, triggerElement?: Element): void
{
    const element = triggerElement ?? boopElement;
    boopManager.addBoop(element as HTMLElement, boopElement as HTMLElement, options);
}

export const Boop = {
    newBoopClass:   newBoopClass,
    newBoopElement: newBoopElement
}