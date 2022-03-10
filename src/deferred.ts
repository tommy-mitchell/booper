export default class Deferred<T>
{
    private _resolve!: (value: T | PromiseLike<T>) => void;
    private _reject!:  (reason?: any) => void;

    private _promise!: Promise<T>;

    private _settled: boolean = false;

    constructor()
    {
        return this.reset();
    }

    private makePromise(): Promise<T>
    {
        return new Promise<T>((resolve, reject) => {
            this._resolve = resolve;
            this._reject  = reject;
        });
    }

    public reset(): this
    {
        this._settled = false;
        this._promise = this.makePromise();

        this._promise.finally(() => {
            this._settled = true;
        });

        return this;
    }

    public resolve(value: T | PromiseLike<T>): void
    {
        this._resolve(value);
    }

    public reject(reason?: any): void
    {
        this._reject(reason);
    }

    public get promise(): Promise<T>
    {
        return this._promise;
    }

    public get settled(): boolean
    {
        return this._settled;
    }
}