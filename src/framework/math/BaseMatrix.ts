import { EPSILON } from "../bones_common";

/**
 * Base class for matrix where T is matrix type that inherits from base.
 */
export class BaseMatrix<T> extends Float32Array
{
    constructor(length: number)
    {
        super(length);
    }

    /**
     * Add two matrices together and returns self.
     * @param { T | Float32Array} other
     * @returns { T } self
     */
    public add(other: T | Float32Array): T
    {
        let l = this.length;
        while (l > 0)
        {
            l--;
            this[l] += other[l];
        }

        return this as unknown as T;
    }

    /**
     * Subtracts other matrix from self and modifies self value.
     * @param { Float32Array }
     * @returns { T } as self.
     */
    public subtract(other: Float32Array): T
    {
        let l = this.length;
        while (l > 0)
        {
            l--;
            this[l] -= other[l];
        }

        return this as unknown as T;

    }

    /**
     * Multiplies self with scalar and returns self.
     */
    public multiplyWithScalar(scalar: number): T
    {
        let l = this.length;
        while (l > 0)
        {
            l--;
            this[l] *= scalar;
        }
        return this as unknown as T;
    }

    /**
    * Multiplies self with other vector 
    */
    public multiply(other: T): T
    {
        let l = this.length;
        while (l > 0)
        {
            l--;
            this[l] *= other[l];
        }
        return this as unknown as T;
    }

    /**
     * Divides self with scalar and returns self.
     */
    public divideWithScalar(scalar: number): T 
    {
        let l = this.length;
        while (l > 0)
        {
            l--;
            this[l] /= scalar;
        }
        return this as unknown as T;
    }

    /**
     * Are color components same as other color components.
     */
    public equals(other: Float32Array): boolean
    {
        for (let i = 0; i < this.length; i++)
        {
            if ((Math.abs(this[i]) - Math.abs(other[i])) > EPSILON)
            {
                return false;
            }
        }

        return true;
    }
}