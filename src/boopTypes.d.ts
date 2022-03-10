import { PartialSpringConfig } from "wobble";

export interface Dictionary<T> {
    [index: string]: T;
}

interface Point {
    x: number;
    y: number;
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

export interface BoopOptions extends Transform {
    /** The timeout for the default end callback. (default: `150ms`) */
    timeout: number;
    /** The callback that fires at the end of the 'boop' effect. (default: `SetTimeout(handler, options.timeout))`) */
    endCallback: StopCondition;
    /** Any parameters for the spring. (default: `{ stiffness: 300, damping: 10 }`) */
    springConfig?: PartialSpringConfig;
    /** A set of `Event`s on which to conditionally trigger the 'boop' effect. */
    events: Dictionary<TriggerCondition>;
    /** A callback that is fired whenever the 'boop' effect is triggered to update any options. */
    valueUpdater: ValueUpdater | undefined;
    [index: string]: any;
}

export interface BoopDetails {
             options:         BoopOptions;
    readonly isBooped:        boolean;
    readonly initialMousePos: Point | undefined;
}