import { EPSILON } from "../../bones_common";
import { BaseMatrix } from "../BaseMatrix";
import { Vec2 } from "./Vec2";
import { Vec4 } from "./Vec4";

/**
 * The vector 3 class.
 */
export class Vec3 extends BaseMatrix<Vec3>
{
    constructor(x: number = 0, y: number = 0, z: number = 0)
    {
        super(3);
        this[0] = x;
        this[1] = y;
        this[2] = z;
    }

    public get x (): number { return this[0]; }
    public get y (): number { return this[1]; }
    public get z (): number { return this[2]; }

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
        return this[0] * this[0] + this[1] * this[1] + this[2] * this[2];
    }

    /**
     * Find distance squared to other vector.
     * @param { Vec3 |Float32Array}
     * @return number 
     */
    public distanceSq (other: Vec3 | Float32Array): number 
    {
        const dx = this[0] - other[0];
        const dy = this[1] - other[1];
        const dz = this[2] - other[2];

        return dx * dx + dy * dy + dz * dz;
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
        this[2] = 0;
    }

    /**
   * Sets the magnitude for self.
   */
    public setMagnitude (magnitude: number): Vec3 
    {
        this.normalize();
        this[0] *= magnitude;
        this[1] *= magnitude;
        this[2] *= magnitude;
        return this;
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
            this[2] /= l;
        }
    }

    /**
     * The dot product with other vector.
     */
    public dot (other: Vec3 | Float32Array): number
    {
        return this[0] * other[0] +
            this[1] * other[1] +
            this[2] * other[2];
    }

    /**
     * Creates and returns vec2 from current vector.
     */
    public toVec2 (): Vec2
    {
        return new Vec2(this[0], this[1]);
    }

    /**
     * Creates and returns vec4 from current vector.
     */
    public toVec4 (w: number): Vec4
    {
        return new Vec4(this[0], this[1], this[2], w);
    }

    /**
     * Creates and returns a copy of vec3.
     */
    public copy (): Vec3
    {
        return new Vec3(this[0], this[1], this[2]);
    }

    /**
     * Does current vector has same values as other one.
    */
    public equals (other: Vec3): boolean
    {
        return (Math.abs(this[0]) - Math.abs(other[0])) < EPSILON &&
            (Math.abs(this[1]) - Math.abs(other[1])) < EPSILON &&
            (Math.abs(this[2]) - Math.abs(other[2])) < EPSILON;
    }

    /**
     * Returns new instance of Vec3 with all components being set to 0.
     */
    public static zero (): Vec3
    {
        return new Vec3(0, 0, 0);
    }

    /** 
     * Returns new instance of Vec3 with all components being set to 1.
     */
    public static one (): Vec3 | Float32Array 
    {
        return new Vec3(1, 1, 1);
    }

    /** 
    * Returns new instance of Vec3 with all components being set to -1.
    * @returns { Vec3 | Float32Array }
    */
    public static negativeOne (): Vec3 | Float32Array 
    {
        return new Vec3(-1, -1, -1);
    }

    /**
     * The unit x vector.
     * @return { Vec3 }
     */
    public static unitX (): Vec3 
    {
        return new Vec3(1, 0, 0);
    }

    /**
     * The negative unit x vector.
     * @return { Vec3 }
     */
    public static negativeUnitX (): Vec3 
    {
        return new Vec3(-1, 0, 0);
    }

    /**
     * The unit y vector.
     * @return { Vec3  }
     */
    public static unitY (): Vec3 
    {
        return new Vec3(0, 1, 0);
    }

    /**
     * The negative unit y vector.
     * @return { Vec3  }
     */
    public static negativeUnitY (): Vec3 
    {
        return new Vec3(0, -1, 0);
    }

    /**
     * The negative unit z vector.
     * @return { Vec3  }
     */
    public static negativeUnitZ (): Vec3 
    {
        return new Vec3(0, 0, -1);
    }

    /**
     * The unit z vector.
     * @return { Vec3 }
     */
    public static unitZ (): Vec3 
    {
        return new Vec3(0, 0, 1);
    }

    /**
     * Creates a new vector 3 or assigns to out vector.
     * @param x 
     * @param y 
     * @param z 
     * @parma out - optional, if passed in, result is saved to out vector.
     */
    public static construct (x: number, y: number, z: number, out?: Vec3): Vec3 
    {
        out = out ?? new Vec3(0, 0, 0);

        out[0] = x;
        out[1] = y;
        out[2] = z;

        return out;
    }

    /**
     * Adds two vectors.
     * @param { Vec3 | Float32Array } a
     * @param { Vec3 | Float32Array } b
     * @param { Vec3 | Float32Array | undefined } out 
     * @return { Vec3 | Float32Array }
     */
    public static add (a: Vec3 | Float32Array, b: Vec3 | Float32Array, out?: Vec3 | Float32Array): Vec3 | Float32Array
    {
        out = out ?? Vec3.zero();

        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        out[2] = a[2] + b[2];

        return out;
    }

    /**
     * Subtracts two vectors.
     * @param a
     * @param b
     * @param out - optional, if passed in, result is saved to out vector.
     * @return { Vec3 }
     */
    public static subtract (a: Vec3, b: Vec3, out?: Vec3): Vec3 
    {
        out = out ?? Vec3.zero();

        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
        out[2] = a[2] - b[2];

        return out;
    }


    /**
     * Multiplies two vectors.
     * @param a - the a vector.
     * @param b - the b vector.
     * @param out - optional, if passed in, result is saved to out vector.
     */
    public static multiply (a: Vec3, b: Vec3, out?: Vec3): Vec3 
    {
        out = out ?? new Vec3(0, 0, 0);

        out[0] = a[0] * b[0];
        out[1] = a[1] * b[1];
        out[2] = a[2] * b[2];

        return out;
    }

    /**
     * Multiplies vector with scalar and returns a new vector or puts result in out vector if passed in.
     * @param { Vec3 | Float32Array } a 
     * @param { number } s 
     * @param { Vec3 | Float32Array | undefined } 
     * @return { Vec3 }
     */
    public static multiplyWithScalar (v: Vec3 | Float32Array, s: number, out?: Vec3 | Float32Array): Vec3 | Float32Array
    {
        out = out ?? Vec3.zero();

        out[0] = v[0] * s;
        out[1] = v[1] * s;
        out[2] = v[2] * s;

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
    public static addVec3MultipledWithScalar (v: Vec3, other: Vec3, scalar: number, out?: Vec3): Vec3
    {
        out = out ?? new Vec3(0, 0, 0);

        out[0] = v[0] + other[0] * scalar;
        out[1] = v[1] + other[1] * scalar;
        out[2] = v[2] + other[2] * scalar;

        return out;
    }


    /**
     * Divides self with scalar and returns self.
     * @param vector - vector to divide.
     * @param scalar - scalar to divide with.
     * @parma out - optional, if passed in, result is saved to out vector.
     */
    public static divideWithScalar (vector: Vec3, scalar: number, out?: Vec3): Vec3 
    {
        out = out ?? new Vec3(0, 0, 0);

        out[0] = vector[0] / scalar;
        out[1] = vector[1] / scalar;
        out[2] = vector[2] / scalar;

        return out;
    }

    /**
     * Dot product between 2 vectors.
     * @param { Vec3|Float32Array } a
     * @param { Vec3|Float32Array } b
     * @return { number }
     */
    public static dot (a: Vec3 | Float32Array, b: Vec3 | Float32Array): number 
    {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    /**
     * The cross product of two vectors.
     * @param a 
     * @param b 
     * @param out optional, if passed in, writes result to out.
     */
    public static cross (a: Vec3 | Float32Array, b: Vec3 | Float32Array, out?: Vec3): Vec3 
    {
        if (!out)
        {
            out = Vec3.zero();
        }

        out[0] = a[1] * b[2] - a[2] * b[1];
        out[1] = a[2] * b[0] - a[0] * b[2];
        out[2] = a[0] * b[1] - a[1] * b[0];

        return out;
    }

    /**
     * Copies the vector.
     * @param { Vec3 | Float32Array } - vector to copy from
     * @param { Vec3 | Float32Array} - vector to copy to, if not passed in new insance is created and returned instead.
     * @returns { Vec3 | Float32Array }
     */
    public static copy (v: Vec3 | Float32Array, out?: Vec3 | Float32Array): Vec3 | Float32Array
    {
        out = out ?? new Vec3(0, 0, 0);

        out[0] = v[0];
        out[1] = v[1];
        out[2] = v[2];

        return out;
    }

    /**
     * Get the length of vector
     * @return { number  }
     */
    public static magnitude (v: Vec3 | Float32Array): number 
    {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    }

    /**
     * Get the length or magnitude of vector squared 
     * @return { number }
     */
    public static magnitudeSq (v: Vec3 | Float32Array): number
    {
        return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
    }

    /**
     * Return new normalized vector from passed in vector or sets the out vector if passed in.
     * @param { Vec3 | Float32Array } - vector to normalize
     * @param { Vec3 | Float32Array | null } - if passed in, this is result of normalization.
     * @return { Vec3 | Float32Array }
     */
    public static normalize (v: Vec3 | Float32Array, out?: Vec3 | Float32Array): Vec3 | Float32Array
    {
        out = out ?? new Vec3(0, 0, 0);

        const l = Vec3.magnitude(v);
        out[0] = v[0] / l;
        out[1] = v[1] / l;
        out[2] = v[2] / l;

        return out;
    }

    /**
     * Reflect vector v around normal n.
     * @param v
     * @param n
     * @parma out - optional, if passed in, result is saved to out vector.
     * @returns 
     */
    public static reflect (v: Vec3, n: Vec3, out?: Vec3): Vec3 
    {
        out = out ?? Vec3.zero();

        // v - n * v_dot_n * 2
        const v_dot_n = Vec3.dot(v, n);
        Vec3.multiplyWithScalar(n, v_dot_n * 2, out);

        return Vec3.subtract(v, out, out);
    }

    /**
     * Create the vec3 from array.
     * @param { ArrayLike<number> } arr
     * @param { Vec3 | Float32Array | undefined } out 
     * @returns { Vec3 | Float32Array }
     */
    public static fromArray (arr: ArrayLike<number>, out?: Vec3 | Float32Array): Vec3 | Float32Array
    {
        if (!out)
        {
            out = new Vec3();
        }

        out[0] = arr[0];
        out[1] = arr[1];
        out[2] = arr[2];

        return out;
    }

    /**
     * Sets the length or magnitude of a vector
     * @param { Vec3 | Float32Array } v 
     * @param { number } mag 
     * @returns { void }  
     */
    public static setMagnitude (v: Vec3 | Float32Array, mag: number): void 
    {
        // First move it to unit vector.
        const m = Vec3.magnitude(v);
        v[0] /= m;
        v[1] /= m;
        v[2] /= m;


        // Now it's unit vector, therefore set new mag.
        v[0] *= mag;
        v[1] *= mag;
        v[2] *= mag;
    }


}