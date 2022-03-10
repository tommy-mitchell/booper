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

interface InternalBoopDetails {
    boopElements:    HTMLElement[];
    options:         BoopOptions;
    isBooped:        Boolean;
    initialMousePos: Point | undefined;
    transforms: Map<Transform, {
        spring: Spring;
        value:  number;
    }>;
    currentTransform: string;
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
        endCallback: handler => setTimeout(handler, BoopManager.DefaultBoopOptions.timeout),
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

    private boopElements: Map<HTMLElement, InternalBoopDetails> = new Map<HTMLElement, InternalBoopDetails>();
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

        this.boopElements.forEach(details => {
            details.currentTransform = "";

            // Simulate each spring for this 'boop' effect
            details.transforms.forEach(transform => {
                if(!transform.spring.isAtRest)
                    transform.spring.step(time);
            });

            // Apply transformations from this step to the `boopElement`
            details.boopElement.style.transform = details.currentTransform;
        });

        // Continue simulation loop, binding with current context
        requestAnimationFrame(this.simulate.bind(this));
    }

    private parseTransforms(details: InternalBoopDetails): void
    {
        // https://stackoverflow.com/a/53767493/10292952
        // instead of "translate"/"scale"/etc, just set the matrix
        Enum.values<Transform>(Transform).forEach(transform => {
            if(details.options[transform] !== BoopManager.DefaultBoopOptions[transform])
            {
                const potentialCurrent = details.transforms.get(transform);

                if(potentialCurrent)
                {
                    potentialCurrent.value = details.options[transform];
                    details.transforms.set(transform, potentialCurrent);
                }
                else
                {
                    details.transforms.set(transform, {
                        spring: new Spring(details.options.springConfig),
                        value:  details.options[transform]
                    });
                }
            }
        });
    }

    private addElement(element: HTMLElement, boopElement: HTMLElement, options: BoopOptions)
    {
        const details: InternalBoopDetails = {
            boopElement:      boopElement,
            options:          options,
            isBooped:         false,
            initialMousePos:  undefined,
            transforms:       new Map(),
            currentTransform: ""
        };

        // Iteratively parse applicable toValues
        this.parseTransforms(details);

        details.transforms.forEach( (pair, transform) => {
            const spring: Spring = pair.spring;
            const reset = transform === Transform.Scale ? 1 : 0;

            spring.onUpdate(s => {
                if(!details.isBooped)
                    spring.setToValue(reset);

                // TODO: matrix transforms
                details.currentTransform += BoopManager.TransformMap.get(transform)!(s.currentValue);
            }).onStop(() => {
                // Reset applied transformations
                details.boopElement.style.transform = '';
                details.initialMousePos = undefined;

                // Tell simulation that this spring is inactive
                this.activeSprings--;
            });
        });

        this.boopElements.set(element, details);
    }

    private doBoop(details: InternalBoopDetails): void
    {
        // Start 'boop' if not already started
        if(!details.isBooped)
        {
            details.isBooped = true;

            details.transforms.forEach(transform => {
                const spring: Spring = transform.spring;
                const toValue: number = transform.value;
                
                spring.setToValue(toValue).start();
                this.activeSprings++;
            });

            // When the provided `endCallback` fires,
            // end the 'boop' effect
            details.options.endCallback(() => {
                details.isBooped = false;
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
        const element     = event.target as HTMLElement;
        const details     = this.boopElements.get(element) as InternalBoopDetails;
        const conditional = details.options.events[event.type].bind(this);

        if(conditional(details, event))
        {
            if(event instanceof MouseEvent)
                details.initialMousePos = { x: event.screenX, y: event.screenY };

            if(details.options.valueUpdater.willUpdate)
            {
                details.options.valueUpdater.handler(details, event);

                this.parseTransforms(details);
            }

            this.doBoop(details);
        }
    }

    /**
     * Adds a given element to the Boop Manager, waiting for a trigger on the `baseElement` and applying the
     * 'boop' effect to the `boopElement`. Returns true if the element was added, false otherwise.
     */
    addBoop(baseElement: HTMLElement, boopElement: HTMLElement, options: Partial<BoopOptions> = BoopManager.DefaultBoopOptions): Boolean
    {
        if(!baseElement || !boopElement)
            return false;

        // Override the default options with any provided options
        const optionsWithFallbacks: BoopOptions = { ...BoopManager.DefaultBoopOptions, ...options };

        // Track element, parse options, create springs
        this.addElement(baseElement, boopElement, optionsWithFallbacks);

        // Register provided event handlers for booping
        Object.keys(optionsWithFallbacks.events).forEach(event => {
            // Trigger 'boop' effect on the base element, binding the class
            // instance context to the event handler
            baseElement.addEventListener(event, this.boopHandler.bind(this));
        });

        return true;
    }

    removeBoop(element: HTMLElement): Boolean
    {
        if(!this.boopElements.has(element))
            return false;
// TODO: remove event listener on element
        const details = this.boopElements.get(element) as InternalBoopDetails;
        details.transforms.forEach(transform => {
            transform.spring.removeAllListeners().stop();
        });

        this.boopElements.delete(element);

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
    console.log(element, boopElement);
    boopManager.addBoop(element as HTMLElement, boopElement as HTMLElement, options);
}

export const Boop = {
    newBoopClass:   newBoopClass,
    newBoopElement: newBoopElement
}