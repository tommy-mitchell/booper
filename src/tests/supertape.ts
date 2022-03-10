import test, { test as _test, Test } from "supertape";

export default (message: string, fn: (t: Test) => void) => _test(message, fn, {
    checkAssertionsCount: false,
});