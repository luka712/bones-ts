import { BaseMatrix } from "../BaseMatrix";
import { Vec3 } from "./Vec3";


/**
 * The vector 2 class.
 */
export class Vec2 extends BaseMatrix<Vec2>
{
    constructor(x: number, y: number)
    {
        super(2);
        this[0] = x;
        this[1] = y;
    }

    /**
     * Get the x component.
     */
    public get x (): number { return this[0]; }
    /**
     * Set the x component.
     */
    public set x (v: number) { this[0] = v; }

    /**
     * Get the y component.
     */
    public get y (): number { return this[1]; }

    /**
     * Set the y component.
     */
    public set y (v: number) { this[1] = v }

    /*
     * Get the magnitude (length) of a vector.
     */
    public magnitude (): number
    {
        return Math.sqrt(this.magnitudeSq());
    }

    /**
     * Get the squard magnitude (square length) of a vector.
     */
    public magnitudeSq (): number 
    {
        return this[0] * this[0] + this[1] * this[1];
    }

    /**
     * Find distance squared to other vector.
     * @param { Vec2 |Float32Array}
     * @return number 
     */
    public distanceSq (other: Vec2 | Float32Array): number 
    {
        const dx = this[0] - other[0];
        const dy = this[1] - other[1];

        return dx * dx + dy * dy;
    }

    /**
     * Distance to other Vec3.
     */
    public distance (other: Vec3): number
    {
        return Math.sqrt(this.distanceSq(other));
    }

    /**
     * Sets the length of self to 0.
     */
    public setLengthToZero (): void
    {
        this[0] = 0;
        this[1] = 0;
    }

    /**
     * Normalize self. Sets unit length of self to 1.
     */
    public normalize (): void 
    {
        const l = this.magnitude();

        if (l != 0)
        {
            this[0] /= l;
            this[1] /= l;
        }
    }

    /**
     * @returns { Vec2 }
     */
    public static unitX (): Vec2 
    {
        return new Vec2(1, 0);
    }

    /**
    * @returns { Vec2  }
    */
    public static unitY (): Vec2 
    {
        return new Vec2(0, 1);
    }

    /**
     * @returns { Vec2  }
     */
    public static zero (): Vec2 
    {
        return new Vec2(0, 0);
    }

    /**
     * Create Vec2 with all components being set to 1.
     * 
     * @returns { Vec2 }
     */
    public static one (): Vec2 
    {
        return new Vec2(1, 1);
    }

    /**
     * @returns { Vec2  }
     */
    public static fromArray (value: ArrayLike<number>): Vec2  
    {
        return new Vec2(value[0], value[1]);
    }
}
