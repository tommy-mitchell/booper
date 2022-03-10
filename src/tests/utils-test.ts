import test from "./supertape";
import { Transform } from "../boop";
import Utils from "../utils";

const transformer = (x: number, y: number, r: number, s: number): Transform => ({
    x:      x,
    y:      y,
    rotate: r,
    scale:  s
});

const transformed = (transform: Transform | undefined): string => {
    return (transform) ? `[${transform.x}, ${transform.y}, ${transform.rotate}, ${transform.scale}]` : "";
};

test("transform: interpolation", t => {
    const transforms = [
        { base: transformer(0, 0, 0, 0), range: transformer(1, 0, 0, 0), value: 0.00, expected: transformer(0.00, 0, 0, 0) },
        { base: transformer(0, 0, 0, 0), range: transformer(1, 0, 0, 0), value: 0.25, expected: transformer(0.25, 0, 0, 0) },
        { base: transformer(0, 0, 0, 0), range: transformer(1, 0, 0, 0), value: 0.50, expected: transformer(0.50, 0, 0, 0) },
        { base: transformer(0, 0, 0, 0), range: transformer(1, 0, 0, 0), value: 0.75, expected: transformer(0.75, 0, 0, 0) },
        { base: transformer(0, 0, 0, 0), range: transformer(1, 0, 0, 0), value: 1.00, expected: transformer(1.00, 0, 0, 0) },
    ];

    for(const tf of transforms)
    {
        t.deepEqual(
            Utils.interpolateTransform(tf.base, tf.range, tf.value),
            tf.expected,
            `'${transformed(tf.base)}' over '${(tf.value).toPrecision(2)}' with range '${transformed(tf.range)}' -> '${transformed(tf.expected)}'`
        );
    }

    t.end();
});

test("transform: to string", t => {
    const transforms = [
        { transform: undefined, expected: "" },
        { transform: transformer(0, 0, 0, 0), expected: "translate(0px, 0px) rotate(0deg) scale(0)" },
        { transform: transformer(1, 0, 0, 0), expected: "translate(1px, 0px) rotate(0deg) scale(0)" },
        { transform: transformer(0, 1, 0, 0), expected: "translate(0px, 1px) rotate(0deg) scale(0)" },
        { transform: transformer(0, 0, 1, 0), expected: "translate(0px, 0px) rotate(1deg) scale(0)" },
        { transform: transformer(0, 0, 0, 1), expected: "translate(0px, 0px) rotate(0deg) scale(1)" },
    ];

    for(const tf of transforms)
        t.equal(Utils.transformToString(tf.transform), tf.expected, `'${transformed(tf.transform)}' -> '${tf.expected}'`);

    t.end();
});
/*
test("get scale and rotation of element", t => {
    const createElement = (s: number, r: number): DOMMatrixReadOnly => {
        const elem = new HTMLElement;
        elem.style.transform = `scale(${s}) rotation(${r}deg)`;

        return new DOMMatrixReadOnly(window.getComputedStyle(elem).getPropertyValue('transform'));
    };

    const elements = [
        { matrix: createElement(0, 0), expected: { scale: 0, rotation: 0 } },
    ];

    for(const element of elements)
        t.deepEqual(Utils.getScaleAndRotation(element.matrix), element.expected);

    t.end();
});*/

/*
test("transform to matrix string", t => {
    

    const toString = (transform: Utils.Transform) => `[${transform.x}, ${transform.y}, ${transform.rotation}, ${transform.scale}]`;
    
    const transforms = [
        { transform: transformer(0, 0, 0, 0), matrix: "matrix(0, 0, 0, 0, 0, 0)" },
        { transform: transformer(1, 1, 0, 1), matrix: "matrix(1, 0, 0, 1, 1, 1)" },
    ];

    t.plan(transforms.length);

    for(const tm of transforms)
        t.equal(Utils.transformToString(tm.transform), tm.matrix, `${toString(tm.transform)} -> ${tm.matrix}`);

    t.end();
});*/