import { Spring, PartialSpringConfig, SpringListenerFn } from "wobble";
import * as Utils from "./utils";

export interface Transform {
    x:        number; // the 'toValue' to translate to on the X axis (default: `0px`)
    y:        number; // the 'toValue' to translate to on the Y axis (default: `0px`)
    rotation: number; // the 'toValue' to rotate towards (default: `0deg`)
    scale:    number; // the 'toValue' to scale to (default: `1`)
    [index: string]: number;
}

type EventCondition = (details: BoopDetails, event: Event) => Boolean;
type StopCondition  = (handler: () => void) => void;
type ValueUpdater   = (details: BoopDetails, event: Event) => void;
export type ValueUpdate    = {
    willUpdate: Boolean;
    handler:    ValueUpdater;
}

export interface BoopOptions {
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
    valueUpdater:  ValueUpdate;
    [index: string]: any;
}

export interface BoopDetails {
             options:         BoopOptions;
    readonly isBooped:        Boolean;
    readonly initialMousePos: Point | undefined;
}

interface Point {
    x: number;
    y: number;
}

type RegisterCallback = () => void;

const DefaultBoopOptions: BoopOptions = {
    x:        0,
    y:        0,
    rotation: 0,
    scale:    1,
    timeout:  150,
    // The default `endCallback` is a simple timeout using the default
    // `timeout` value
    endCallback: handler => setTimeout(handler, DefaultBoopOptions.timeout), // TODO: get instance timeout
    springConfig: {
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

interface SpringDetails {
    spring: Spring;
    transform: keyof Transform;
}

export class BoopElement
{
    private _element: HTMLElement;
    private _options: BoopOptions;
    private _spring:  Spring;
    private _base:    Transform;

    private _range: Transform = {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 0
    };

    private _transforms: SpringDetails[];

    private _current: Transform | undefined = undefined;
    private _isBooped: Boolean = false;
    private _initialMousePos: Point | undefined = undefined;

    private _registerCallback: RegisterCallback;

    constructor(element: HTMLElement, options: Partial<BoopOptions>, register: RegisterCallback)
    {
        // Override the default options with any provided options
        const optionsWithFallbacks: BoopOptions = { ...DefaultBoopOptions, ...options };

        // Include necessary spring config options (no raf, range of 0 - 1)
        optionsWithFallbacks.springConfig = { ...{ requestAnimationFrame: false, fromValue: 0, toValue: 1 }, ...options.springConfig };

        this._element = element;
        this._options = optionsWithFallbacks;
        this._spring  = new Spring(this._options.springConfig);
        this._base    = Utils.getTransform(element);

        // TODO: better way of getting default
        if(options.timeout !== DefaultBoopOptions.timeout)
            this._options.endCallback = handler => setTimeout(handler, this._options.timeout);

        // Iteratively parse applicable toValues
        this.parseTransforms();

        this._spring.onUpdate(s => {
            this._current = Utils.interpolateTransform(this._base, this._range, s.currentValue);
        }).onStop(() => {
            this._initialMousePos = undefined;
        });

        this._registerCallback = register;
    }

    get events(): string[]
    {
        return Object.keys(this._options.events);
    }

    /**
     * Advances the 'boop', returning true if it has finished. False otherwise.
     */
    step(time: number): Boolean
    {
        // Reset applied transformations
        this._current = undefined;

        // Advance spring if still moving
        if(this.isActive)
            this._spring.step(time);

        // Apply transformations made on this step
        this._element.style.transform = Utils.transformToString(this._current);

        // Finished if spring is done
        return this._spring.isAtRest;
    }

    get isActive(): Boolean
    {
        return this._spring.isAnimating;
    }

    private parseTransforms(): void
    {
        Object.keys(this._range).forEach(transform => {
            const toValue: number = this._options[transform];
            const baseCSS: number = this._base[transform];

            // Spring is interpolated over the range, so if the `toValue`
            // has changed, we need to recalculate the range for the
            // given Transform
            if(toValue !== baseCSS)
                this._range[transform] = toValue;
        });
    }

    private doBoop(): void
    {
        // Start 'boop' if not already started
        if(!this._isBooped)
        {
            // Mark element as animating
            this._isBooped = true;

            // Reset style
            this._element.style.transform = '';

            // Start spring and register it with the simulation
            const reset: SpringListenerFn = (spring: Spring) => {
                if(!this._isBooped)
                    spring.setToValue(0).removeListener(reset);
            };

            // Register element with simulation if not already registered
            if(!this.isActive)
                this._registerCallback();

            this._spring.setToValue(25).onUpdate(reset).start();

            // When the provided `endCallback` fires,
            // end the 'boop' effect
            this._options.endCallback(() => {
                this._isBooped = false;
            });
        }
    }

    private get _boopDetails(): BoopDetails
    {
        return {
            options:         this._options,
            isBooped:        this._isBooped,
            initialMousePos: this._initialMousePos
        };
    }

    trigger(event: Event): void
    {
        const conditional: EventCondition = this._options.events[event.type]?.bind(this);

        if(conditional(this._boopDetails, event))
        {
            if(this._options.valueUpdater.willUpdate)
            {
                if(event instanceof MouseEvent)
                    this._initialMousePos = { x: event.screenX, y: event.screenY };

                this._options.valueUpdater.handler(this._boopDetails, event);

                this.parseTransforms();
            }

            this.doBoop();
        }
    }
}