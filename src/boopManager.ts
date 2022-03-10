import { BoopElement, BoopOptions } from "./boop";

type TriggerElement = HTMLElement;

class BoopManager
{
    /** Maps each trigger element to a set of elements that get 'booped' when a specified event fires. */
    private _triggerElements: Map<TriggerElement, BoopElement[]> = new Map<TriggerElement, BoopElement[]>();

    /** Tracks the number of boop elements being simulated. If 0, the simulation is stopped. */
    private _activeElements: number = 0;

    // A flag to track the status of the simulation
    // Decouples from activeElements
    /** is this necessary?? */
    private _isAnimating: boolean = false;

    /**
     * Simulates every active boop element at a concurrent timestep, using one `requestAnimationFrame()` call.
     */
    private _simulate(): void
    {
        // Stop simulation if no boop elements are currently active
        if(this._activeElements === 0)
        {
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
    private _boopHandler(event: Event): void
    {
        const element = event.target as TriggerElement;
        const before = this._activeElements;

        this._triggerElements.get(element)?.forEach(boopElement => {
            const promise: Promise<void> | null = boopElement.trigger(event);

            if(promise)
            {
                promise.finally(() => this._activeElements--);
                this._activeElements++;
            }
        });

        // Resume spring simulation if none were active
        if(before !== this._activeElements && !this._isAnimating)
        {
            this._isAnimating = true;
            this._simulate();
        }
    }

    /**
     * 
     */
    private _addElement(triggerElement: TriggerElement, newBoopElement: BoopElement): void
    {
        const possibleList = this._triggerElements.get(triggerElement);

        if(possibleList)
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
    addBoop(triggerElement: HTMLElement, boopElement: HTMLElement, options: Partial<BoopOptions>): boolean
    {
        if(!triggerElement || !boopElement)
            return false;

        this._addElement(triggerElement, new BoopElement(boopElement, options));

        return true;
    }

    // removeBoop
}

// Only export one instance of the boop manager.
export default new BoopManager();