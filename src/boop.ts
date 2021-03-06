import { Spring, PartialSpringConfig, SpringListenerFn } from "wobble";
import Deferred from "./deferred";
import * as Utils from "./utils";
import { Point } from "./utils";

interface Dictionary<T> {
    [index: string]: T;
}

export interface Transform {
    /** The `toValue` to translate to on the X axis. (default: `0px`) */
    x: number;
    /** The `toValue` to translate to on the Y axis. (default: `0px`) */
    y: number;
    /** The `toValue` to rotate towards. (default: `0deg`) */
    rotate: number;
    /** The `toValue` to scale to. (default: `1`) */
    scale: number;
    [index: string]: number;
}

type TriggerCondition = (details: BoopDetails, event: Event) => boolean;
type StopCondition  = (handler: () => void) => void;
export type ValueUpdater = (details: BoopDetails, event: Event) => void;

interface EventTrigger {
    event:    string;
    trigger?: TriggerCondition;
}

export interface BoopOptions extends Transform {
    /** The timeout for the default end callback. (default: `150ms`) */
    timeout: number;
    /** The callback that fires at the end of the 'boop' effect. (default: `SetTimeout(handler, options.timeout))`) */
    endCallback: StopCondition;
    /** Any parameters for the spring. (default: `{ stiffness: 300, damping: 10 }`) */
    springConfig?: PartialSpringConfig;
    /** A set of `Event`s on which to conditionally trigger the 'boop' effect. */
    //events: EventTrigger[];
    events: string[];
    triggers: Dictionary<TriggerCondition>;
    /** A callback that is fired whenever the 'boop' effect is triggered to update any options. */
    valueUpdater?: ValueUpdater;
    [index: string]: any;
}

export interface BoopDetails {
             options:         BoopOptions;
    readonly isBooped:        boolean;
    readonly initialMousePos: Point | undefined;
}

// TODO: unify default w/ instance timeout
const endCallbackFactory = (options: BoopOptions): StopCondition => (handler => setTimeout(handler, options.timeout));

const DefaultBoopOptions: BoopOptions = {
    x:       0,
    y:       0,
    rotate:  0,
    scale:   1,
    timeout: 150,
    // The default `endCallback` is a simple timeout using the default
    // `timeout` value
    endCallback: handler => setTimeout(handler, DefaultBoopOptions.timeout), // TODO: get instance timeout
    springConfig: {
        stiffness: 300,
        damping:   10
    },
    events: [
        "mouseenter"
    ],
    triggers: {
        "mouseenter": (details: BoopDetails, event: Event) => {
            if(details.initialMousePos === undefined)
                return true;

            const mousePos = Utils.getRelativePosition(event as MouseEvent);
            
            // Can't boop if mouse has barely moved (no accidental double booping) - (true if moved enough)
            return (Math.abs(details.initialMousePos.x - mousePos.x) > 15) ||
                   (Math.abs(details.initialMousePos.y - mousePos.y) > 15);
        }
    }
    /*events: {
        // The default 'boop' effect triggers on `mouseenter` of the
        // `baseElement`.  The effect has a chance of moving off the
        // cursor while animating and retriggering itself when
        // returning to its starting position. This conditional checks
        // that the cursor has moved a significant enough distance
        // between `mouseenter`s before allowing the 'boop' to trigger
        "mouseenter": (details: BoopDetails, event: Event) => {
            if(details.initialMousePos === undefined)
                return true;
            
            // Can't boop if mouse has barely moved (no accidental double booping)
            return (Math.abs(details.initialMousePos.x - (event as MouseEvent).screenX) > 15) ||
                   (Math.abs(details.initialMousePos.y - (event as MouseEvent).screenY) > 15);
        }
    }*/
}

export class BoopElement
{
    /** The element to apply the 'boop' effect on. */
    private _element:         HTMLElement;
    /** The configuration for the 'boop' effect. */
    private _options:         BoopOptions;
    /** The original CSS transform on the `_element`. */
    private _base:            Transform;
    /** A collection of `Springs` for each CSS transform defined in `_options`. */
    private _transforms:      Dictionary<Spring> = {};
    /** The CSS transform for the current 'boop' effect animation step. */
    private _current:         Transform;
    /** If the 'boop' effect is active (i.e., the `Spring`s are still animating towards their `toValue`s). */
    private _isBooped:        boolean = false;
    /** The initial screen coordinates of the mouse if the 'boop' effect is triggered on a `MouseEvent`. */
    private _initialMousePos: Point | undefined = undefined;
    /** A `Promise` provided to the boop manager to tell it when the 'boop' effect has finished. */
    private _deferred:        Deferred<void>;

    constructor(element: HTMLElement, options: Partial<BoopOptions>)
    {
        this._element = element;
        this._options = this._parseOptions(options);
        this._base    = Utils.getTransform(this._element);
        this._current = this._base;

        // Iteratively parse applicable `toValue`s
        this._parseTransforms();

        this._deferred = new Deferred<void>();
    }

    /**
     * Merges any provided `options` with the `DefaultBoopOptions`, handling any necessary overrides.
     */
    private _parseOptions(options: Partial<BoopOptions>): BoopOptions
    {
        // Override the default options with any provided options
        const optionsWithFallbacks: BoopOptions = { ...DefaultBoopOptions, ...options };

        // Only want the events from the provided options if they're defined
        //if(options.events)
        //    optionsWithFallbacks.events = options.events;
        optionsWithFallbacks.triggers = options.triggers ?? {};

        // Include necessary spring config options (no raf)
        optionsWithFallbacks.springConfig = { ...{ requestAnimationFrame: false }, ...DefaultBoopOptions.springConfig, ...options.springConfig };

        // TODO: better way of getting default
        //if(options.timeout !== DefaultBoopOptions.timeout)
            optionsWithFallbacks.endCallback = handler => setTimeout(handler, this._options.timeout);

        return optionsWithFallbacks;
    }

    /**
     * Iteratively parse any transforms defined in `_options` and set/create `Spring`s for them.
     */
    private _parseTransforms(): void
    {
        // Create a spring for any value different from the base transform
        Object.keys(this._base).forEach(transform => {
            const toValue: number = this._options[transform];
            const baseCSS: number = this._base[transform];

            // 
            if(toValue !== baseCSS)
            {
                //console.log({ ...this._options.springConfig, fromValue: baseCSS, toValue: baseCSS + toValue }, transform);

                // If a spring already exists for the given transform, change its `toValue`
                if(this._transforms[transform] !== undefined)
                    this._transforms[transform].setToValue(toValue);
                else
                {
                    // Create a spring for the given transform if it doesn't already exist
                    const spring = this._transforms[transform] = new Spring({ 
                        ...this._options.springConfig,
                        fromValue: baseCSS,
                        toValue: baseCSS + toValue
                    });

                    // Update the given transform on each 'step'
                    spring.onUpdate(s => this._current[transform] = s.currentValue);
                }
            }
        });
    }

    /**
     * The events defined for this boop element to trigger its 'boop' effect.
     */
    public get triggers(): string[]
    {
        return this._options.events;
    }

    /**
     * Advances the 'boop' effect if it is currently animating, applying its CSS transforms and resolving
     * the Promise passed to the boop manager if the effect finishes on this step.
     */
    public step(time: number): void
    {
        // Don't do anything if the 'boop' effect has finished
        if(this._deferred.settled)
            return;

        // Reset applied transformations (copy base transform)
        this._current = { ...this._base };

        let hasFinished: boolean = true;

        // Advance each spring if still moving
        for(const [transform, spring] of Object.entries(this._transforms))
        {
            if(!spring.isAtRest)
            {
                spring.step(time);
            
                // If any spring is still moving, hasFinished is false
                if(!spring.isAtRest)
                    hasFinished = false;
                //else
                //    console.log(spring.isAnimating, spring)
            }
            /*else
                this._current[transform] = this._options[transform];*/
        }

        // Finished if all springs are done
        if(hasFinished && !this._isBooped)
        {
            this._element.style.transform = "";
            this._initialMousePos = undefined;

            // Tell the boop manager that the 'boop' effect for this element is finished
            this._deferred.resolve();
        }
        else
        {
            // Apply CSS transformations made on this step
            this._element.style.transform = Utils.transformToString(this._current);
        }
    }

    

    /**
     * Start the 'boop' effect if it has not already started.
     */
    private _doBoop(): void
    {
        if(this._isBooped)
            return;

        this._isBooped = true;
        this._element.style.transform = "";

        // Start every spring
        for(const [transform, spring] of Object.entries(this._transforms))
        {
            // Add reset listener if spring is not currently active
            if(spring._listeners.length === 1) // only has `onUpdate`
            {
                // Reset spring to base CSS value once 'boop' effect has ended
                const reset: SpringListenerFn = (spring: Spring) => {
                    if(!this._isBooped)
                        spring.setToValue(this._base[transform]).removeListener(reset);
                };

                spring.onUpdate(reset);
            }

            // Reset spring and start it
            spring.updateConfig({
                fromValue: this._base[transform],
                toValue:   this._base[transform] + this._options[transform]
            }).start();

            //console.log(transform, spring.isAtRest, spring)
        }

        // When the provided `endCallback` fires, end the 'boop' effect
        this._options.endCallback(() => {
            this._isBooped = false;
        });
    }

    /**
     * Get information to pass to the event conditional so that the `options` are modifiable.
     */
    private get _boopDetails(): BoopDetails
    {
        return {
            options:         this._options,
            isBooped:        this._isBooped,
            initialMousePos: this._initialMousePos
        };
    }

    /**
     * Trigger the 'boop' effect on this boop element if the given `event` is defined on it.
     */
    public trigger(event: Event): Promise<void> | null
    {
        if(this._options.events.includes(event.type))
        {
            const triggerConditional: TriggerCondition | undefined = this._options.triggers[event.type]?.bind(this);

            // Can 'boop' if no condition or if conditional returns true
            if(!triggerConditional || triggerConditional(this._boopDetails, event))
            {
                // Update `toValue`s if a handler is provided
                if(this._options.valueUpdater)
                {
                    // Set initial mouse position to the screen coordinates if triggered by a mouse
                    if(event instanceof MouseEvent)
                        this._initialMousePos = Utils.getRelativePosition(event);
        
                    // Update `toValue`s and parse any that changed
                    this._options.valueUpdater(this._boopDetails, event);
                    this._parseTransforms();
                }

                // Create a new Promise if not currently animating
                if(this._deferred.settled)
                    this._deferred.reset();
        
                this._doBoop();
        
                // Return a Promise to the boop manager
                return this._deferred.promise;
            }
        }

        // Since the 'boop' effect wasn't triggered, don't return a Promise
        return null;
    }
}