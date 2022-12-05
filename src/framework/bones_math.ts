import { Color } from "./math/Color";
import { Mat4x4 } from "./math/mat/Mat4x4";
import { Rect } from "./math/Rect";
import { Vec2 } from "./math/vec/Vec2";

/**
  * @brief Generate a random floating number between two numbers.
  *
  * @param { number } min - minimum value of a number.
  * @param { number } max - maximum value of a number.
  * @return { number }
  */
function randomFloat(min: number, max: number): number 
{
    return Math.random() * (max - min + 1) + min;
}

/**
* @brief Generate a random integer number between two numbers. Min is inclusive.
*
* @param { number } min - minimum value of a number. Inclusive.
* @param { number } max - maximum value of a number.
* @return { number }
*/
function randomInt(min: number, max: number): number 
{
    return Math.floor(Math.random() * (max - min ) + min);
}

export 
{
    Color,
    Vec2,
    Mat4x4,
    Rect,
    randomFloat,
    randomInt
}