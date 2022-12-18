import { BaseMatrix } from "../BaseMatrix";
import { MathUtil } from "../MathUtil";
import { Quaternion } from "../quaternion/Quaternion";
import { Rect } from "../Rect";
import { Vec3 } from "./Vec3";


/**
 * The vector 2 class.
 */
export class Vec2 extends BaseMatrix<Vec2>
{
    // just optimization variables 
    private static temp_v2_a: Vec2;
    private static temp_v2_b: Vec2;
    private static temp_v2_c: Vec2;

    private static temp_v3_a: Vec3;
    private static temp_v3_b: Vec3;
    private static temp_v3_c: Vec3;

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
     * Sets the magnitude for self.
     */
    public setMagnitude (magnitude: number): Vec2 
    {
        this.normalize();
        this[0] *= magnitude;
        this[1] *= magnitude;
        return this;
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
     * @param other
     */
    public distanceSq (other: Vec2 | Float32Array): number 
    {
        const dx = this[0] - other[0];
        const dy = this[1] - other[1];

        return dx * dx + dy * dy;
    }

    /**
     * Distance to other vector.
     */
    public distance (other: Vec2): number
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
     * Copies the vector.
     * @returns {@link Vec2}
     */
    public copy (): Vec2 
    {
        return new Vec2(this.x, this.y);
    }

    /**
     * Gets the vector angle
     * @returns 
     */
    public angle (): number 
    {
        return Math.atan2(this[1], this[0]);
    }

    /**
     * Keeps the vector within given bounds.
     * @param v - vector to keep within bounds.
     * @param bounds - the bounds.
     * @param out - optional, if passed in, result is saved to out vector.
     */
    public clampToBounds (bounds: Rect): Vec2 
    {
        // handle x
        if (this[0] < bounds.x)
        {
            this[0] = bounds.x;
        }
        else if (this[0] > bounds.w)
        {
            this[0] = bounds.w;
        }

        // handle y
        if (this[1] < bounds.y)
        {
            this[1] = bounds.y;
        }
        else if (this[1] > bounds.h)
        {
            this[1] = bounds.h;
        }

        return this;
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
     * Adds vector a - vector b.
     * @param a 
     * @param b 
     * @param out - optional out vector. If specified that vector is modified. Avoids allocating new vector.
     * @returns {@link Vec2} - new instance or passed in out vector as result.
     */
    public static add (a: Vec2, b: Vec2, out?: Vec2): Vec2 
    {
        out = out ?? new Vec2(0, 0);

        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        return out;
    }

    /**
     * Subtract vector a - vector b.
     * @param a 
     * @param b 
     * @param out - optional out vector. If specified that vector is modified. Avoids allocating new vector.
     * @returns {@link Vec2} - new instance or passed in out vector as result.
     */
    public static subtract (a: Vec2, b: Vec2, out?: Vec2): Vec2 
    {
        out = out ?? new Vec2(0, 0);

        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
        return out;
    }


    /**
     * Multiply vector a * vector b.
     * @param a 
     * @param b 
     * @param out - optional out vector. If specified that vector is modified. Avoids allocating new vector.
     * @returns {@link Vec2} - new instance or passed in out vector as result.
     */
    public static multiply (a: Vec2, b: Vec2, out?: Vec2): Vec2 
    {
        out = out ?? new Vec2(0, 0);

        out[0] = a[0] * b[0];
        out[1] = a[1] * b[1];
        return out;
    }


    /**
     * Multiply a vector with scalar.
     * @param v - the vector.
     * @param s - the scalar.
     * @param out - optional out vector. If specified that vector is modified. Avoids allocating new vector.
     */
    public static multiplyWithScalar (v: Vec2, s: number, out?: Vec2): Vec2 
    {
        out = out ?? new Vec2(0, 0);

        out[0] = v[0] * s;
        out[1] = v[1] * s;
        return out;
    }


    /**
     * Add a vector multiplied by scalar to vector v.
     * v += other * scalar
     * 
     * @param v - the vector.
     * @param other - vector to be mulitipled by scalar and added to vector v.
     * @param scalar - the scalar.
     * @param out - optional out vector. If specified that vector is modified. Avoids allocating new vector.
     */
    public static addVec2MultipledWithScalar (v: Vec2, other: Vec2, scalar: number, out?: Vec2): Vec2 
    {
        out = out ?? new Vec2(0, 0);

        out[0] = v[0] + other[0] * scalar;
        out[1] = v[1] + other[1] * scalar;
        return out;
    }

    /**
     * Clamps vector component wise between 2 vectors.
     * @param v - the value vector.
     * @param min - the minimum value.
     * @param max - the maximum value.
     * @param out - optional out vector. If specified that vector is modified. Avoids allocating new vector.
     * @returns {@link Vec2}
     */
    public static clamp (v: Vec2, min: Vec2, max: Vec2, out?: Vec2): Vec2 
    {
        out = out ?? new Vec2(0, 0);

        if (v[0] < min[0])
        {
            v[0] = min[0];
        }
        else if (v[0] > max[0])
        {
            v[0] = max[0];
        }

        if (v[1] < min[1])
        {
            v[1] = min[1];
        }
        else if (v[1] > max[1])
        {
            v[1] = max[1];
        }

        return out;
    }

    /**
     * Normalizes a vector and returns normalized vector.
     * @param v - input vector.
     * @param out - optional out vector. If specified that vector is modified. Avoids allocating new vector.
     * @returns {@link Vec2} - new instance or passed in out vector as result.
     */
    public static normalize (v: Vec2, out?: Vec2): Vec2 
    {
        out = out ?? new Vec2(0, 0);

        const l = v.magnitude();

        if (l != 0)
        {
            out[0] /= l;
            out[1] /= l;
        }

        return out;
    }

    /**
     * Sets the magnitude of a vector.
     * @param v - input vector.
     * @param m - desired magnitude.
     * @param out - optional out vector. If specified that vector is modified. Avoids allocating new vector.
     * @returns {@link Vec2} - new instance or passed in out vector as result.
     */
    public static setMagnitude (v: Vec2, m: number, out?: Vec2): Vec2 
    {
        out = out ?? new Vec2(0, 0);

        Vec2.normalize(v, out);
        out[0] *= m;
        out[1] *= m;

        return out;
    }

    /**
     * @returns { Vec2  }
     */
    public static fromArray (value: ArrayLike<number>): Vec2  
    {
        return new Vec2(value[0], value[1]);
    }

    /**
     * Divides self with scalar and returns self.
     * @param vector - vector to divide.
     * @param scalar - scalar to divide with.
     * @parma out - optional, if passed in, result is saved to out vector.
     */
    public static divideWithScalar (vector: Vec2, scalar: number, out?: Vec2): Vec2 
    {
        if (!out)
        {
            out = new Vec2(0, 0);
        }

        out[0] = vector[0] / scalar;
        out[1] = vector[1] / scalar;

        return out;
    }

    /**
     * Creates the vector from polar coordinates.
     * @param angle - the angle.
     * @param magnitude - the magnitude.
     * @parma out - optional, if passed in, result is saved to out vector.
     * @returns 
     */
    public static fromPolar (angle: number, magnitude: number, out?: Vec2): Vec2 
    {
        if (!out)
        {
            out = new Vec2(0, 0);
        }

        out[0] = Math.cos(angle) * magnitude;
        out[1] = Math.sin(angle) * magnitude;
        return out;
    }

    /**
     * Rotates a vec2 with quaternion.
     * @param v - the vector. 
     * @param q - the quaternion.
     * @param out - optional, if passed in, result is saved to out vector.
     */
    public static rotateWithQuaternion (v: Vec2, q: Quaternion, out?: Vec2): Vec2 
    {
        this.temp_v3_a = Vec3.construct(q[0] + q[0], q[1] + q[1], q[2] + q[2], this.temp_v3_a);
        this.temp_v3_b = Vec3.construct(q[0], q[0], q[3], this.temp_v3_b);
        this.temp_v3_c = Vec3.construct(1, q[1], q[2], this.temp_v3_c);

        Vec3.multiply(this.temp_v3_a, this.temp_v3_b, this.temp_v3_b);
        Vec3.multiply(this.temp_v3_a, this.temp_v3_c, this.temp_v3_c);

        const a = this.temp_v3_b;
        const b = this.temp_v3_c;

        out = out ?? new Vec2(0, 0);
        out[0] = v[0] * (1.0 - b[1] - b[2]) + v[1] * (a[1] - a[2]);
        out[1] = v[0] * (a[1] + a[2]) + v[1] * (1.0 - a[0] - b[2]);

        return out;
    }

    /**
      * Find distance squared to other vector.
      * @param a 
      * @param b
      */
    public static distanceSq (a: Vec2, b: Vec2): number 
    {
        const dx = a[0] - b[0];
        const dy = a[1] - b[1];

        return dx * dx + dy * dy;
    }

    /**
     * Distance to other vector.
     * @param a 
    * @param b
     */
    public static distance (a: Vec2, b: Vec2): number
    {
        return Math.sqrt(this.distanceSq(a, b));
    }

    /**
     * Create a random vec2.
     * @param min - the min x,y component value.
     * @param max - the max x,y component value.
     * @param out - optional, if passed in, result is saved to out vector.
     */
    public static random (min: number, max: number, out?: Vec2): Vec2 
    {
        out = out ?? new Vec2(0, 0);
        out[0] = MathUtil.randomFloat(min, max);
        out[1] = MathUtil.randomFloat(min, max);
        return out;
    }

    /**
     * Keeps the vector within given bounds.
     * @param v - vector to keep within bounds.
     * @param bounds - the bounds.
     * @param out - optional, if passed in, result is saved to out vector.
     */
    public static clampToBounds (v: Vec2, bounds: Rect, out?: Vec2): Vec2 
    {
        out = out ?? new Vec2(0, 0);

        out[0] = v[0];
        out[1] = v[1];

        // handle x
        if (out[0] < bounds.x)
        {
            out[0] = bounds.x;
        }
        else if (out[0] > bounds.w)
        {
            out[0] = bounds.w;
        }

        // handle y
        if (out[1] < bounds.y)
        {
            out[1] = bounds.y;
        }
        else if (out[1] > bounds.h)
        {
            out[1] = bounds.h;
        }

        return out;
    }
}
