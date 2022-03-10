(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = '<p>These are <a href="https://www.joshwcomeau.com/react/boop">boops</a>!</p>\n<p>This library provides a simple way of creating <em>Boop</em> effects in vanilla JavaScript using a fork of <a href="https://github.com/skevy/wobble"><em>wobble</em></a>, a tiny library for simulating spring physics.</p>\n<p>The effects on this page are an exaggerated demo of what can be created – in practice, they\'re far better as subtle effects, like the chevron indicator next to the accordion button above. Open the example modal below to see some simpler examples.</p>\n<p>For more information, check out the <a href="">NPM page</a>.</p>\n';
},{}],2:[function(require,module,exports){
"use strict";var _dist = require('booper/dist');

_dist.makeDefaultBoops.call(void 0, );

// Custom value updater
const rotateAwayFromMouse = (details, event) => {
    const direction = (event ).offsetX < 50 ? 1 : -1;

    details.options.rotate = Math.abs(details.options.rotate) * direction;
}

// Create 'boop' effects
_dist.newBoopClass.call(void 0, "boop-scale",  { scale: 2, rotate: 50, valueUpdater: rotateAwayFromMouse });
_dist.newBoopClass.call(void 0, "boop-rotate", { rotate: 30 });
_dist.newBoopClass.call(void 0, "boop-transX", { x: 75, timeout: 50, springConfig: { stiffness: 500, damping: 20 } });
_dist.newBoopClass.call(void 0, "boop-square", { y: 20, rotate: 40, valueUpdater: rotateAwayFromMouse });
_dist.newBoopClass.call(void 0, "boop-button", { y: 5 }); // TODO: start on enter/click; mousedown, end on mouseup/leave (once: true)

function lerp(number, currentScaleMin, currentScaleMax, newScaleMin, newScaleMax)
{
    // Normalize between 0 and 1
    const standardNormalization = (number - currentScaleMin) / (currentScaleMax - currentScaleMin);
    // Transpose value to desired scale
    return ((newScaleMax - newScaleMin) * standardNormalization + newScaleMin);
}

const starTrigger = document.querySelector(".star svg") ;
const circles  = starTrigger.parentElement.querySelectorAll(".circle");
const distance = 42;

for(let index = 0; index < 5; index++)
{
    const angle       = index * (360/5) - 90;
    const angleInRads = (angle * 3.14) / 180;

    const x = distance * Math.cos(angleInRads);
    console.log(angle, angleInRads, x, ((x / distance )* 180 / 3.14))
    const y = distance * Math.sin(angleInRads);

    let timing = lerp(index, 0, 4, 450, 600);
    timing    *= 1 + index * .22;

    const friction = lerp(index, 0, 4, 15, 40);

    _dist.newBoopElement.call(void 0, circles[index], {
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
},{"booper/dist":7}],3:[function(require,module,exports){
"use strict";// Add info to accordion
const markdown = document.createRange().createContextualFragment(require("./about.md"));
document.querySelector("#accordion > #content").append(markdown);

// Open accordion on button click
const accordion = document.querySelector("#info") ;
accordion.querySelector("button").addEventListener("click", () => {
    accordion.classList.toggle("expand");
    (document.activeElement ).blur();
});

// Open/close modal on click
const modal    = document.querySelector("#modal-container") ;
const modalBtn = document.querySelector("#open-modal") ;
const modalBg  = document.querySelector("#modal-background") ;
modalBtn.addEventListener("click", () => modal.classList.add("show"));
modalBg.addEventListener("click", () => modal.classList.remove("show"));
},{"./about.md":1}],4:[function(require,module,exports){
"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }var _wobble = require('wobble');
var _deferred2 = require('./deferred'); var _deferred3 = _interopRequireDefault(_deferred2);
var _utils = require('./utils'); var Utils = _interopRequireWildcard(_utils);
// TODO: unify default w/ instance timeout
const endCallbackFactory = (options) => (handler => setTimeout(handler, options.timeout));
const DefaultBoopOptions = {
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    timeout: 150,
    // The default `endCallback` is a simple timeout using the default
    // `timeout` value
    endCallback: handler => setTimeout(handler, DefaultBoopOptions.timeout),
    springConfig: {
        stiffness: 300,
        damping: 10
    },
    events: {
        // The default 'boop' effect triggers on `mouseenter` of the
        // `baseElement`.  The effect has a chance of moving off the
        // cursor while animating and retriggering itself when
        // returning to its starting position. This conditional checks
        // that the cursor has moved a significant enough distance
        // between `mouseenter`s before allowing the 'boop' to trigger
        ['mouseenter']: (details, event) => {
            if (details.initialMousePos === undefined)
                return true;
            // Can't boop if mouse has barely moved (no accidental double booping)
            return (Math.abs(details.initialMousePos.x - event.screenX) > 15) ||
                (Math.abs(details.initialMousePos.y - event.screenY) > 15);
        }
    },
    // The default 'boop' effect does not change its `toValue`
    valueUpdater: undefined
};
 class BoopElement {
    constructor(element, options) {
        /** A collection of `Springs` for each CSS transform defined in `_options`. */
        this._transforms = {};
        /** If the 'boop' effect is active (i.e., the `Spring`s are still animating towards their `toValue`s). */
        this._isBooped = false;
        /** The initial screen coordinates of the mouse if the 'boop' effect is triggered on a `MouseEvent`. */
        this._initialMousePos = undefined;
        // Override the default options with any provided options
        const optionsWithFallbacks = { ...DefaultBoopOptions, ...options };
        // Only want the events from the provided options if they're defined
        if (options.events)
            optionsWithFallbacks.events = options.events;
        // Include necessary spring config options (no raf)
        optionsWithFallbacks.springConfig = { ...{ requestAnimationFrame: false }, ...DefaultBoopOptions.springConfig, ...options.springConfig };
        this._element = element;
        this._options = optionsWithFallbacks;
        this._base = Utils.getTransform(this._element);
        this._current = this._base;
        // TODO: better way of getting default
        //if(options.timeout !== DefaultBoopOptions.timeout)
        this._options.endCallback = handler => setTimeout(handler, this._options.timeout);
        // Iteratively parse applicable `toValue`s
        this.parseTransforms();
        this._deferred = new (0, _deferred3.default)();
    }
    /**
     * The events defined for this boop element to trigger its 'boop' effect.
     */
    get triggers() {
        return Object.keys(this._options.events);
    }
    /**
     * Advances the 'boop' effect if it is currently animating, applying its CSS transforms and resolving
     * the Promise passed to the boop manager if the effect finishes on this step.
     */
    step(time) {
        // Don't do anything if the 'boop' effect has finished
        if (this._deferred.settled)
            return;
        // Reset applied transformations (copy base transform)
        this._current = { ...this._base };
        let hasFinished = true;
        // Advance each spring if still moving
        for (const [transform, spring] of Object.entries(this._transforms)) {
            if (!spring.isAtRest) {
                spring.step(time);
                // If any spring is still moving, hasFinished is false
                if (!spring.isAtRest)
                    hasFinished = false;
                //else
                //    console.log(spring.isAnimating, spring)
            }
        }
        // Finished if all springs are done
        if (hasFinished) {
            // Remove any applied CSS transformations
            this._element.style.transform = "";
            // Unset the initial mouse position
            this._initialMousePos = undefined;
            // Tell the boop manager that the 'boop' effect for this element is finished
            this._deferred.resolve();
        }
        else {
            // Apply CSS transformations made on this step
            this._element.style.transform = Utils.transformToString(this._current);
        }
    }
    /**
     * Iteratively parse any transforms defined in `_options` and set/create `Spring`s for them.
     */
    parseTransforms() {
        // Create a spring for any value different from the base transform
        Object.keys(this._base).forEach(transform => {
            const toValue = this._options[transform];
            const baseCSS = this._base[transform];
            // 
            if (toValue !== baseCSS) {
                //console.log({ ...this._options.springConfig, fromValue: baseCSS, toValue: baseCSS + toValue }, transform);
                // If a spring already exists for the given transform, change its `toValue`
                if (this._transforms[transform] !== undefined)
                    this._transforms[transform].setToValue(toValue);
                else {
                    // Create a spring for the given transform if it doesn't already exist
                    const spring = this._transforms[transform] = new (0, _wobble.Spring)({ ...this._options.springConfig, fromValue: baseCSS, toValue: baseCSS + toValue });
                    // Set its listener
                    spring.onUpdate(s => {
                        // Update the given transform
                        this._current[transform] = s.currentValue;
                    });
                }
            }
        });
    }
    /**
     * Start the 'boop' effect if it has not already started.
     */
    doBoop() {
        // Don't restart if 'boop' effect has already been triggered
        if (this._isBooped)
            return;
        // Mark element as animating
        this._isBooped = true;
        // Reset style
        this._element.style.transform = "";
        // Start every spring
        for (const [transform, spring] of Object.entries(this._transforms)) {
            // Add reset listener if spring is not currently active
            if (spring._listeners.length == 1) // only has `onUpdate`
             {
                // Reset spring to base CSS value once 'boop' effect has ended
                const reset = (spring) => {
                    if (!this._isBooped)
                        spring.setToValue(this._base[transform]).removeListener(reset);
                };
                spring.onUpdate(reset);
            }
            // Reset the spring and start it
            //spring.setToValue(this._base[transform] + this._options[transform]).start();
            spring.updateConfig({
                fromValue: this._base[transform],
                toValue: this._base[transform] + this._options[transform]
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
    get _boopDetails() {
        return {
            options: this._options,
            isBooped: this._isBooped,
            initialMousePos: this._initialMousePos
        };
    }
    /**
     * Trigger the 'boop' effect on this boop element if the given `event` is defined on it.
     */
    trigger(event) {
        const conditional = _optionalChain([this, 'access', _ => _._options, 'access', _2 => _2.events, 'access', _3 => _3[event.type], 'optionalAccess', _4 => _4.bind, 'call', _5 => _5(this)]);
        if (conditional(this._boopDetails, event)) {
            // Update `toValue`s if a handler is provided
            if (this._options.valueUpdater) {
                // Set initial mouse position to the screen coordinates if triggered by a mouse
                if (event instanceof MouseEvent)
                    this._initialMousePos = { x: event.screenX, y: event.screenY };
                // Update `toValue`s
                this._options.valueUpdater(this._boopDetails, event);
                // Iteratively parse applicable `toValue`s
                this.parseTransforms();
            }
            // Create a new Promise if not currently animating
            if (this._deferred.settled)
                this._deferred.reset();
            // Trigger 'boop' effect
            this.doBoop();
            // Return a Promise to the boop manager
            return this._deferred.promise;
        }
        // Since the 'boop' effect wasn't triggered, don't return a Promise
        return null;
    }
} exports.BoopElement = BoopElement;

},{"./deferred":6,"./utils":8,"wobble":9}],5:[function(require,module,exports){
"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }var _boop = require('./boop');
class BoopManager {
    constructor() {
        /** Maps each trigger element to a set of elements that get 'booped' when a specified event fires. */
        this._triggerElements = new Map();
        /** Tracks the number of boop elements being simulated. If 0, the simulation is stopped. */
        this._activeElements = 0;
        // A flag to track the status of the simulation
        // Decouples from activeElements
        /** is this necessary?? */
        this._isAnimating = false;
        // removeBoop
    }
    /**
     * Simulates every active boop element at a concurrent timestep, using one `requestAnimationFrame()` call.
     */
    _simulate() {
        // Stop simulation if no boop elements are currently active
        if (this._activeElements === 0) {
            this._isAnimating = false;
            return;
        }
        const time = Date.now();
        // Simulate each boop element
        this._triggerElements.forEach(boopElements => {
            boopElements.forEach(boopElement => boopElement.step(time));
        });
        // Continue simulation loop, binding with current context
        requestAnimationFrame(this._simulate.bind(this));
    }
    /**
     * An event handler that triggers a 'boop' effect on each boop element when the specified event
     * is fired on the targeted trigger element.
     */
    _boopHandler(event) {
        const element = event.target;
        const before = this._activeElements;
        _optionalChain([this, 'access', _ => _._triggerElements, 'access', _2 => _2.get, 'call', _3 => _3(element), 'optionalAccess', _4 => _4.forEach, 'call', _5 => _5(boopElement => {
            const promise = boopElement.trigger(event);
            if (promise) {
                promise.finally(() => this._activeElements--);
                this._activeElements++;
            }
        })]);
        // Resume spring simulation if none were active
        if (before !== this._activeElements && !this._isAnimating) {
            this._isAnimating = true;
            this._simulate();
        }
    }
    /**
     *
     */
    _addElement(triggerElement, newBoopElement) {
        const possibleList = this._triggerElements.get(triggerElement);
        if (possibleList)
            possibleList.push(newBoopElement);
        else
            this._triggerElements.set(triggerElement, [newBoopElement]);
        // Register provided event handlers for booping
        newBoopElement.triggers.forEach(trigger => {
            // Trigger 'boop' effect on the base element, binding the class
            // instance context to the event handler
            triggerElement.addEventListener(trigger, this._boopHandler.bind(this));
        });
    }
    /**
     * Adds a given element to the boop manager, waiting for a trigger on the `baseElement` and applying the
     * 'boop' effect to the `boopElement`. Returns true if the element was added, false otherwise.
     */
    addBoop(triggerElement, boopElement, options) {
        if (!triggerElement || !boopElement)
            return false;
        this._addElement(triggerElement, new (0, _boop.BoopElement)(boopElement, options));
        return true;
    }
}
// Only export one instance of the boop manager.
exports. default = new BoopManager();

module.exports = exports.default;

},{"./boop":4}],6:[function(require,module,exports){
"use strict";Object.defineProperty(exports, "__esModule", {value: true}); class Deferred {
    constructor() {
        this._settled = false;
        return this.reset();
    }
    makePromise() {
        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }
    reset() {
        this._settled = false;
        this._promise = this.makePromise();
        this._promise.finally(() => {
            this._settled = true;
        });
        return this;
    }
    resolve(value) {
        this._resolve(value);
    }
    reject(reason) {
        this._reject(reason);
    }
    get promise() {
        return this._promise;
    }
    get settled() {
        return this._settled;
    }
} exports.default = Deferred;

module.exports = exports.default;

},{}],7:[function(require,module,exports){
"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }var _boopManager = require('./boopManager'); var _boopManager2 = _interopRequireDefault(_boopManager);
/**
 * Watch the provided `boopElement` to trigger a 'boop' effect on it with the given `options`. If a
 * `triggerElement` is provided, watches it instead and then triggers the 'boop' effect on the given
 * `boopElement`.
 */
 function newBoopElement(boopElement, options, triggerElement) {
    const element = _nullishCoalesce(triggerElement, () => ( boopElement));
    _boopManager2.default.addBoop(element, boopElement, options);
} exports.newBoopElement = newBoopElement;
/**
 * Search for any child elements on the given `triggerElement` with the class `boop`, and create
 * a `BoopElement` for it.
 */
function addBoops(triggerElement, options) {
    const boopElements = triggerElement.querySelectorAll(".boop");
    if (boopElements.length > 0)
        boopElements.forEach(boopElement => newBoopElement(boopElement, options, triggerElement));
    else
        newBoopElement(triggerElement, options);
}
/**
 * Find all elements with the given class name and create 'boop' effects for them with the given
 * `options`, applying the effect on any child elements with the class `boop` if they exist.
 */
 function newBoopClass(className, options) {
    window.addEventListener("load", () => {
        // Applies 'boop' effect on the specified elements, defaulting to
        // the base element if none provided
        document.querySelectorAll(`.${className}`).forEach(element => addBoops(element, options));
    });
} exports.newBoopClass = newBoopClass;
 function makeDefaultBoops() {
    window.addEventListener("load", () => {
        /** An array of elements with transforms specified. */
        const boopElements = [
            ...document.querySelectorAll(`[class*="boop-x-"]`),
            ...document.querySelectorAll(`[class*="boop-y-"]`),
            ...document.querySelectorAll(`[class*="boop-rotate-"]`),
            ...document.querySelectorAll(`[class*="boop-scale-"]`)
        ];
        boopElements.forEach(boopElement => {
            // Find the 'boop' class for the given element
            const boopClass = Array.from(boopElement.classList).filter(name => name.startsWith("boop"))[0];
            /** The indexes of any transform specified. */
            const transformIndexes = [
                boopClass.indexOf("x-"),
                boopClass.indexOf("y-"),
                boopClass.indexOf("rotate-"),
                boopClass.indexOf("scale-")
            ];
            let config = {};
            // Parse the `boopClass` to create the options for the given element
            transformIndexes.forEach(transformIndex => {
                if (transformIndex !== -1) {
                    // "boop-x-10-rotate-50" -> "x, 10, rotate, 50"
                    const boopDetails = boopClass.substring(transformIndex).split('-');
                    const transform = boopDetails[0];
                    const toValue = Number(boopDetails[1]);
                    // { x: 10 }
                    config[transform] = toValue;
                }
            });
            // Create all `BoopElement`s if any transforms are parsed
            if (config !== {})
                addBoops(boopElement, config);
        });
    });
} exports.makeDefaultBoops = makeDefaultBoops;
exports. default = {
    newBoopClass: newBoopClass,
    newBoopElement: newBoopElement,
    makeDefaultBoops: makeDefaultBoops
};

},{"./boopManager":5}],8:[function(require,module,exports){
"use strict";Object.defineProperty(exports, "__esModule", {value: true});var CSSMatrix;
(function (CSSMatrix) {
    CSSMatrix["ScaleX"] = "a";
    CSSMatrix["SkewY"] = "b";
    CSSMatrix["SkewX"] = "c";
    CSSMatrix["ScaleY"] = "d";
    CSSMatrix["TranslateX"] = "e";
    CSSMatrix["TranslateY"] = "f";
})(CSSMatrix || (CSSMatrix = {}));
 function zeroTransform() {
    return {
        x: 0,
        y: 0,
        rotate: 0,
        scale: 0
    };
} exports.zeroTransform = zeroTransform;
 function interpolateTransform(base, range, value) {
    let interpolatedTransform = {};
    Object.keys(range).forEach(key => {
        // LERP: start value + (spring value * (end value - start value))
        interpolatedTransform[key] = base[key] + value * range[key];
    });
    return interpolatedTransform;
} exports.interpolateTransform = interpolateTransform;
 function transformToString(transform) {
    if (transform === undefined)
        return "";
    /*const matrix = new DOMMatrix();

    matrix[CSSMatrix.ScaleX]     =  Math.cos(transform.rotate) * transform.scale;
    matrix[CSSMatrix.SkewY]      =  Math.sin(transform.rotate) * transform.scale;
    matrix[CSSMatrix.SkewX]      = -Math.sin(transform.rotate) * transform.scale;
    matrix[CSSMatrix.ScaleY]     =  Math.cos(transform.rotate) * transform.scale;
    matrix[CSSMatrix.TranslateX] =  transform.x;
    matrix[CSSMatrix.TranslateY] =  transform.y;

    return matrix.toString();*/
    return `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotate}deg) scale(${transform.scale})`;
} exports.transformToString = transformToString;
 function getScaleAndRotation(matrix) {
    const scaleX = matrix[CSSMatrix.ScaleX];
    const skewY = matrix[CSSMatrix.SkewY];
    const scale = Math.sqrt((scaleX * scaleX) + (skewY * skewY));
    const angle = Math.round(Math.atan2(skewY, scaleX) * (180 / Math.PI));
    return {
        scale: scale,
        rotate: angle
    };
} exports.getScaleAndRotation = getScaleAndRotation;
 function getTransform(element) {
    const matrix = new DOMMatrixReadOnly(window.getComputedStyle(element).getPropertyValue('transform'));
    const { scale, rotate } = getScaleAndRotation(matrix);
    return {
        x: matrix[CSSMatrix.TranslateX],
        y: matrix[CSSMatrix.TranslateY],
        rotate: rotate,
        scale: scale
    };
} exports.getTransform = getTransform;
exports. default = {
    zeroTransform: zeroTransform,
    interpolateTransform: interpolateTransform,
    transformToString: transformToString,
    getScaleAndRotation: getScaleAndRotation,
    getTransform: getTransform
};

},{}],9:[function(require,module,exports){
"use strict";"use strict";
/**
 *  @license
 *  Copyright 2017 Adam Miskiewicz
 *
 *  Use of this source code is governed by a MIT-style license that can be found
 *  in the LICENSE file or at https://opensource.org/licenses/MIT.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
/**
 * Implements a spring physics simulation based on the equations behind
 * damped harmonic oscillators (https://en.wikipedia.org/wiki/Harmonic_oscillator#Damped_harmonic_oscillator).
 */
var Spring = /** @class */ (function () {
    function Spring(config) {
        if (config === void 0) { config = {}; }
        this._listeners = [];
        this._currentAnimationStep = 0; // current requestAnimationFrame
        this._currentTime = 0; // Current timestamp of animation in ms (real time)
        this._springTime = 0; // Current time along the spring curve in ms (zero-based)
        this._currentValue = 0; // the current value of the spring
        this._currentVelocity = 0; // the current velocity of the spring
        this._isAnimating = false;
        this._oscillationVelocityPairs = [];
        this._config = {
            fromValue: utils_1.withDefault(config.fromValue, 0),
            toValue: utils_1.withDefault(config.toValue, 1),
            stiffness: utils_1.withDefault(config.stiffness, 100),
            damping: utils_1.withDefault(config.damping, 10),
            mass: utils_1.withDefault(config.mass, 1),
            initialVelocity: utils_1.withDefault(config.initialVelocity, 0),
            overshootClamping: utils_1.withDefault(config.overshootClamping, false),
            allowsOverdamping: utils_1.withDefault(config.allowsOverdamping, false),
            restVelocityThreshold: utils_1.withDefault(config.restVelocityThreshold, 0.001),
            restDisplacementThreshold: utils_1.withDefault(config.restDisplacementThreshold, 0.001),
            requestAnimationFrame: utils_1.withDefault(config.requestAnimationFrame, true)
        };
        this._currentValue = this._config.fromValue;
        this._currentVelocity = this._config.initialVelocity;
    }
    /**
     * If `fromValue` differs from `toValue`, or `initialVelocity` is non-zero,
     * start the simulation and call the `onStart` listeners.
     *
     * If `requestAnimationFrame` is true, start the animation loop.
     */
    Spring.prototype.start = function () {
        var _this = this;
        var _a = this._config, fromValue = _a.fromValue, toValue = _a.toValue, initialVelocity = _a.initialVelocity;
        if (fromValue !== toValue || initialVelocity !== 0) {
            this._reset();
            this._isAnimating = true;
            if (!this._currentAnimationStep) {
                this._notifyListeners("onStart");
                if (this._config.requestAnimationFrame) {
                    /**
                     * `raf` is the main loop. While the animation is running, it updates
                     * the current state once per frame, and schedules the next frame if
                     * the spring is not yet at rest.
                     */
                    var raf_1 = function () {
                        _this.step();
                        // Check `_isAnimating`, in case `stop()` got called during `_step()`.
                        if (_this._isAnimating) {
                            _this._currentAnimationStep = requestAnimationFrame(raf_1);
                        }
                    };
                    raf_1();
                }
            }
        }
        return this;
    };
    /**
     * Advances the simulation, using the current time if no `timestamp` is provided.
     */
    Spring.prototype.step = function (timestamp) {
        if (timestamp === void 0) { timestamp = Date.now(); }
        this._advanceSpringToTime(timestamp, true);
        return this;
    };
    /**
     * If a simulation is in progress, stop it and call the `onStop` listeners.
     */
    Spring.prototype.stop = function () {
        if (!this._isAnimating) {
            return this;
        }
        this._isAnimating = false;
        this._notifyListeners("onStop");
        if (this._currentAnimationStep) {
            cancelAnimationFrame(this._currentAnimationStep);
            this._currentAnimationStep = 0;
        }
        return this;
    };
    Object.defineProperty(Spring.prototype, "currentValue", {
        /**
         * The spring's current position.
         */
        get: function () {
            return this._currentValue;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Spring.prototype, "currentVelocity", {
        /**
         * The spring's current velocity in units / ms.
         */
        get: function () {
            return this._currentVelocity; // give velocity in units/ms;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Spring.prototype, "isAtRest", {
        /**
         * If the spring has reached its `toValue`, or if its velocity is below the
         * `restVelocityThreshold`, it is considered at rest. If `stop()` is called
         * during a simulation, both `isAnimating` and `isAtRest` will be false.
         */
        get: function () {
            return this._isSpringAtRest();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Spring.prototype, "isAnimating", {
        /**
         * Whether or not the spring is currently emitting values.
         *
         * Note: this is distinct from whether or not it is at rest.
         * See also `isAtRest`.
         */
        get: function () {
            return this._isAnimating;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Updates the spring config with the given values. Values not explicitly
     * supplied will be reused from the existing config.
     */
    Spring.prototype.updateConfig = function (updatedConfig) {
        // When we update the spring config, we reset the simulation to ensure
        // the spring always moves the full distance between `fromValue` and
        // `toValue`. To ensure that the simulation behaves correctly if those
        // values aren't being changed in `updatedConfig`, we run the simulation
        // with `_advanceSpringToTime()` and default `fromValue` and `initialVelocity`
        // to their current values.
        // Run simulation without notifying listeners.
        this._advanceSpringToTime(Date.now());
        this._config.fromValue = this._currentValue;
        this._config.initialVelocity = this._currentVelocity;
        // Update config without allocating any new memory
        for (var key in updatedConfig) {
            if (this._config.hasOwnProperty(key)) {
                this._config[key] = updatedConfig[key];
            }
        }
        this._reset();
        return this;
    };
    /**
     * Updates the spring config's `toValue` with the provided value.
     */
    Spring.prototype.setToValue = function (value) {
        return this.updateConfig({ toValue: value });
    };
    /**
     * The provided callback will be invoked when the simulation begins.
     */
    Spring.prototype.onStart = function (listener) {
        this._listeners.push({ onStart: listener });
        return this;
    };
    /**
     * The provided callback will be invoked on each frame while the simulation is
     * running.
     */
    Spring.prototype.onUpdate = function (listener) {
        this._listeners.push({ onUpdate: listener });
        return this;
    };
    /**
     * The provided callback will be invoked when the simulation ends.
     */
    Spring.prototype.onStop = function (listener) {
        this._listeners.push({ onStop: listener });
        return this;
    };
    /**
     * Remove a single listener from this spring.
     */
    Spring.prototype.removeListener = function (listenerFn) {
        this._listeners = this._listeners.reduce(function (result, listener) {
            var foundListenerFn = Object.values(listener).indexOf(listenerFn) !== -1;
            if (!foundListenerFn) {
                result.push(listener);
            }
            return result;
        }, []);
        return this;
    };
    /**
     * Removes all listeners from this spring.
     */
    Spring.prototype.removeAllListeners = function () {
        this._listeners = [];
        return this;
    };
    Spring.prototype._reset = function () {
        this._currentTime = Date.now();
        this._springTime = 0.0;
        this._currentValue = this._config.fromValue;
        this._currentVelocity = this._config.initialVelocity;
    };
    Spring.prototype._notifyListeners = function (eventName) {
        var _this = this;
        this._listeners.forEach(function (listener) {
            var maybeListenerFn = listener[eventName];
            if (typeof maybeListenerFn === "function") {
                maybeListenerFn(_this);
            }
        });
    };
    Spring.prototype._advanceSpringToTime = function (timestamp, shouldNotifyListeners) {
        if (shouldNotifyListeners === void 0) { shouldNotifyListeners = false; }
        // `_advanceSpringToTime` updates `_currentTime` and triggers the listeners.
        // Because of these side effects, it's only safe to call when an animation
        // is already in-progress.
        if (!this._isAnimating) {
            return;
        }
        var deltaTime = timestamp - this._currentTime;
        // If for some reason we lost a lot of frames (e.g. process large payload or
        // stopped in the debugger), we only advance by 4 frames worth of
        // computation and will continue on the next frame. It's better to have it
        // running at slower speed than jumping to the end.
        if (deltaTime > Spring.MAX_DELTA_TIME_MS) {
            deltaTime = Spring.MAX_DELTA_TIME_MS;
        }
        this._springTime += deltaTime;
        var c = this._config.damping;
        var m = this._config.mass;
        var k = this._config.stiffness;
        var fromValue = this._config.fromValue;
        var toValue = this._config.toValue;
        var v0 = -this._config.initialVelocity;
        utils_1.invariant(m > 0, "Mass value must be greater than 0");
        utils_1.invariant(k > 0, "Stiffness value must be greater than 0");
        var zeta = c / (2 * Math.sqrt(k * m)); // damping ratio (dimensionless)
        var omega0 = Math.sqrt(k / m) / 1000; // undamped angular frequency of the oscillator (rad/ms)
        var omega1 = omega0 * Math.sqrt(1.0 - zeta * zeta); // exponential decay
        var omega2 = omega0 * Math.sqrt(zeta * zeta - 1.0); // frequency of damped oscillation
        var x0 = toValue - fromValue; // initial displacement of the spring at t = 0
        if (zeta > 1 && !this._config.allowsOverdamping) {
            zeta = 1;
        }
        var oscillation = 0.0;
        var velocity = 0.0;
        var t = this._springTime;
        if (zeta < 1) {
            // Under damped
            var envelope = Math.exp(-zeta * omega0 * t);
            oscillation =
                toValue -
                    envelope *
                        ((v0 + zeta * omega0 * x0) / omega1 * Math.sin(omega1 * t) +
                            x0 * Math.cos(omega1 * t));
            // This looks crazy -- it's actually just the derivative of the
            // oscillation function
            velocity =
                zeta *
                    omega0 *
                    envelope *
                    (Math.sin(omega1 * t) * (v0 + zeta * omega0 * x0) / omega1 +
                        x0 * Math.cos(omega1 * t)) -
                    envelope *
                        (Math.cos(omega1 * t) * (v0 + zeta * omega0 * x0) -
                            omega1 * x0 * Math.sin(omega1 * t));
        }
        else if (zeta === 1) {
            // Critically damped
            var envelope = Math.exp(-omega0 * t);
            oscillation = toValue - envelope * (x0 + (v0 + omega0 * x0) * t);
            velocity =
                envelope * (v0 * (t * omega0 - 1) + t * x0 * (omega0 * omega0));
        }
        else {
            // Overdamped
            var envelope = Math.exp(-zeta * omega0 * t);
            oscillation =
                toValue -
                    envelope *
                        ((v0 + zeta * omega0 * x0) * Math.sinh(omega2 * t) +
                            omega2 * x0 * Math.cosh(omega2 * t)) /
                        omega2;
            velocity =
                envelope *
                    zeta *
                    omega0 *
                    (Math.sinh(omega2 * t) * (v0 + zeta * omega0 * x0) +
                        x0 * omega2 * Math.cosh(omega2 * t)) /
                    omega2 -
                    envelope *
                        (omega2 * Math.cosh(omega2 * t) * (v0 + zeta * omega0 * x0) +
                            omega2 * omega2 * x0 * Math.sinh(omega2 * t)) /
                        omega2;
        }
        this._currentTime = timestamp;
        this._currentValue = oscillation;
        this._currentVelocity = velocity;
        if (!shouldNotifyListeners) {
            return;
        }
        this._notifyListeners("onUpdate");
        if (!this._isAnimating) {
            // a listener might have stopped us in _onUpdate
            return;
        }
        // If the Spring is overshooting (when overshoot clamping is on), or if the
        // spring is at rest (based on the thresholds set in the config), stop the
        // animation.
        if (this._isSpringOvershooting() || this._isSpringAtRest()) {
            if (k !== 0) {
                // Ensure that we end up with a round value
                this._currentValue = toValue;
                this._currentVelocity = 0;
                this._notifyListeners("onUpdate");
            }
            this.stop();
            return;
        }
    };
    Spring.prototype._isSpringOvershooting = function () {
        var _a = this._config, stiffness = _a.stiffness, fromValue = _a.fromValue, toValue = _a.toValue, overshootClamping = _a.overshootClamping;
        var isOvershooting = false;
        if (overshootClamping && stiffness !== 0) {
            if (fromValue < toValue) {
                isOvershooting = this._currentValue > toValue;
            }
            else {
                isOvershooting = this._currentValue < toValue;
            }
        }
        return isOvershooting;
    };
    Spring.prototype._isSpringAtRest = function () {
        var _a = this._config, stiffness = _a.stiffness, toValue = _a.toValue, restDisplacementThreshold = _a.restDisplacementThreshold, restVelocityThreshold = _a.restVelocityThreshold;
        var isNoVelocity = Math.abs(this._currentVelocity) <= restVelocityThreshold;
        var isNoDisplacement = stiffness !== 0 &&
            Math.abs(toValue - this._currentValue) <= restDisplacementThreshold;
        return isNoDisplacement && isNoVelocity;
    };
    Spring.MAX_DELTA_TIME_MS = 1 / 60 * 1000 * 4; // advance 4 frames at max
    return Spring;
}());
exports.Spring = Spring;

},{"./utils":10}],10:[function(require,module,exports){
"use strict";"use strict";
/**
 *  @license
 *  Copyright 2017 Adam Miskiewicz
 *
 *  Use of this source code is governed by a MIT-style license that can be found
 *  in the LICENSE file or at https://opensource.org/licenses/MIT.
 */
Object.defineProperty(exports, "__esModule", { value: true });
function invariant(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
exports.invariant = invariant;
function withDefault(maybeValue, defaultValue) {
    return typeof maybeValue !== "undefined" && maybeValue !== null
        ? maybeValue
        : defaultValue;
}
exports.withDefault = withDefault;

},{}]},{},[3,2]);
