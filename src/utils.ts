import { Transform } from "./boop";

enum CSSMatrix {
    ScaleX     = "a",
    SkewY      = "b",
    SkewX      = "c",
    ScaleY     = "d",
    TranslateX = "e",
    TranslateY = "f"
}

export function zeroTransform(): Transform
{
    return {
        x: 0,
        y: 0,
        rotate: 0,
        scale: 0
    };
}

export function interpolateTransform(base: Transform, range: Transform, value: number): Transform
{
    let interpolatedTransform = {} as Transform;

    Object.keys(range).forEach(key => {
        // LERP: start value + (spring value * (end value - start value))
        interpolatedTransform[key] = base[key] + value * range[key];
    });

    return interpolatedTransform;
}

export function transformToString(transform: Transform | undefined): string
{
    if(transform === undefined)
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
}

export function getScaleAndRotation(matrix: DOMMatrixReadOnly)
{
    const scaleX = matrix[CSSMatrix.ScaleX];
    const  skewY = matrix[CSSMatrix.SkewY];

    const scale = Math.sqrt((scaleX * scaleX) + (skewY * skewY));
    const angle = Math.round(Math.atan2(skewY, scaleX) * (180 / Math.PI));

    return {
        scale:  scale,
        rotate: angle
    };
}

export function getTransform(element: HTMLElement): Transform
{
    const matrix = new DOMMatrixReadOnly(window.getComputedStyle(element).getPropertyValue('transform'));
    const { scale, rotate } = getScaleAndRotation(matrix);

    return <Transform> {
        x:      matrix[CSSMatrix.TranslateX],
        y:      matrix[CSSMatrix.TranslateY],
        rotate: rotate,
        scale:  scale
    };
}

export default {
    zeroTransform: zeroTransform,
    interpolateTransform: interpolateTransform,
    transformToString: transformToString,
    getScaleAndRotation: getScaleAndRotation,
    getTransform: getTransform
};