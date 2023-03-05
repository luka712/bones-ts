import { stat } from 'fs';

/**
 * The math utility functions.
 */
export class MathUtil
{
    public static readonly PI = Math.PI
    public static readonly TWO_PI = Math.PI * 2;
    public static readonly HALF_PI = Math.PI * 0.5

    /**
      * @brief Generate a random floating number between two numbers.
      *
      * @param { number } min - minimum value of a number.
      * @param { number } max - maximum value of a number.
      * @return { number }
      */
    public static randomFloat (min: number, max: number): number 
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
    public static randomInt (min: number, max: number): number 
    {
        return Math.floor(Math.random() * (max - min) + min);
    }

    /**
     * Wraps the angle to be betweeen -PI and PI.
     * @param angle - the angle. 
     */
    public static wrapAngle (angle: number): number 
    {
        if (angle > -MathUtil.PI && angle < MathUtil.PI)
        {
            return angle;
        }

        angle %= MathUtil.TWO_PI;
        if (angle <= -MathUtil.PI)
        {
            return angle + MathUtil.TWO_PI;
        }
        if (angle > MathUtil.PI)
        {
            return angle - MathUtil.TWO_PI;
        }

        return angle;
    }

    /**
     * Linearry interpolate between start and end for 'amount' value.
     * @param start 
     * @param end 
     * @param amount 
     */
    public static lerp(start: number, end: number, amount: number) : number 
    {
        return start + (end - start) * amount;
    }

    /**
     * Clamps value between two values.
     * @param value - the value.
     * @param min - the minimum value.
     * @param max - the maximum value.
     * @returns - value, min if value is below min, max if value is above max.
     */
    public static clamp(value: number, min: number, max: number) : number 
    {
        value = Math.max(value, min);
        return Math.min(value, max);
    }

    /**
     * Convert angle in degrees to radians.
     * @param angle angle in degrees.
     * @returns angle in radians.
     */
    public static radians(angle: number) : number 
    {
        return angle * Math.PI / 180;
    }
}