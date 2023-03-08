import { EPSILON } from "../../bones_common";
import { Vec3 } from "../vec/Vec3";
import { Vec4 } from "../vec/Vec4";
import { Mat3x3F } from "./Mat3x3F";

/**
 * The matrix 4x4 class
 */
export class Mat4x4 extends Float32Array
{
    constructor(
        r0c0: number, r0c1: number, r0c2: number, r0c3: number,
        r1c0: number, r1c1: number, r1c2: number, r1c3: number,
        r2c0: number, r2c1: number, r2c2: number, r2c3: number,
        r3c0: number, r3c1: number, r3c2: number, r3c3: number
    )
    {
        super(16);

        // column index
        let col = 0;
        this[col + 0] = r0c0;
        this[col + 1] = r1c0;
        this[col + 2] = r2c0;
        this[col + 3] = r3c0;

        col = 4;
        this[col + 0] = r0c1;
        this[col + 1] = r1c1;
        this[col + 2] = r2c1;
        this[col + 3] = r3c1;

        col = 8;
        this[col + 0] = r0c2;
        this[col + 1] = r1c2;
        this[col + 2] = r2c2;
        this[col + 3] = r3c2;

        col = 12;
        this[col + 0] = r0c3;
        this[col + 1] = r1c3;
        this[col + 2] = r2c3;
        this[col + 3] = r3c3;

    }

    // first col
    public get r0c0 (): number { return this[0]; }
    public get r1c0 (): number { return this[1]; }
    public get r2c0 (): number { return this[2]; }
    public get r3c0 (): number { return this[3]; }

    // second col
    public get r0c1 (): number { return this[4]; }
    public get r1c1 (): number { return this[5]; }
    public get r2c1 (): number { return this[6]; }
    public get r3c1 (): number { return this[7]; }

    // third col
    public get r0c2 (): number { return this[8]; }
    public get r1c2 (): number { return this[9]; }
    public get r2c2 (): number { return this[10]; }
    public get r3c2 (): number { return this[11]; }

    // fourth col
    public get r0c3 (): number { return this[12]; }
    public get r1c3 (): number { return this[13]; }
    public get r2c3 (): number { return this[14]; }
    public get r3c3 (): number { return this[15]; }

    // first col
    public set r0c0 (v: number) { this[0] = v; }
    public set r1c0 (v: number) { this[1] = v; }
    public set r2c0 (v: number) { this[2] = v; }
    public set r3c0 (v: number) { this[3] = v; }

    // second col
    public set r0c1 (v: number) { this[4] = v; }
    public set r1c1 (v: number) { this[5] = v; }
    public set r2c1 (v: number) { this[6] = v; }
    public set r3c1 (v: number) { this[7] = v; }

    // third col
    public set r0c2 (v: number) { this[8] = v; }
    public set r1c2 (v: number) { this[9] = v; }
    public set r2c2 (v: number) { this[10] = v; }
    public set r3c2 (v: number) { this[11] = v; }

    // fourth col
    public set r0c3 (v: number) { this[12] = v; }
    public set r1c3 (v: number) { this[13] = v; }
    public set r2c3 (v: number) { this[14] = v; }
    public set r3c3 (v: number) { this[15] = v; }

    /**
     * Multiply self with other matrix and return self
     */
    public multiply (other: Mat4x4): Mat4x4
    {
        const r0c0 = this[0] * other[0] + this[4] * other[1] + this[8] * other[2] + this[12] * other[3];
        const r0c1 = this[0] * other[4] + this[4] * other[5] + this[8] * other[6] + this[12] * other[7];
        const r0c2 = this[0] * other[8] + this[4] * other[9] + this[8] * other[10] + this[12] * other[11];
        const r0c3 = this[0] * other[12] + this[4] * other[13] + this[8] * other[14] + this[12] * other[15];

        const r1c0 = this[1] * other[0] + this[5] * other[1] + this[9] * other[2] + this[13] * other[3];
        const r1c1 = this[1] * other[4] + this[5] * other[5] + this[9] * other[6] + this[13] * other[7];
        const r1c2 = this[1] * other[8] + this[5] * other[9] + this[9] * other[10] + this[13] * other[11];
        const r1c3 = this[1] * other[12] + this[5] * other[13] + this[9] * other[14] + this[13] * other[15];

        const r2c0 = this[2] * other[0] + this[6] * other[1] + this[10] * other[2] + this[14] * other[3];
        const r2c1 = this[2] * other[4] + this[6] * other[5] + this[10] * other[6] + this[14] * other[7];
        const r2c2 = this[2] * other[8] + this[6] * other[9] + this[10] * other[10] + this[14] * other[11];
        const r2c3 = this[2] * other[12] + this[6] * other[13] + this[10] * other[14] + this[14] * other[15];

        const r3c0 = this[3] * other[0] + this[7] * other[1] + this[11] * other[2] + this[15] * other[3];
        const r3c1 = this[3] * other[4] + this[7] * other[5] + this[11] * other[6] + this[15] * other[7];
        const r3c2 = this[3] * other[8] + this[7] * other[9] + this[11] * other[10] + this[15] * other[11];
        const r3c3 = this[3] * other[12] + this[7] * other[13] + this[11] * other[14] + this[15] * other[15];

        this[0] = r0c0;
        this[1] = r1c0;
        this[2] = r2c0;
        this[3] = r3c0;

        this[4] = r0c1;
        this[5] = r1c1;
        this[6] = r2c1;
        this[7] = r3c1;

        this[8] = r0c2;
        this[9] = r1c2;
        this[10] = r2c2;
        this[11] = r3c2;

        this[12] = r0c3;
        this[13] = r1c3;
        this[14] = r2c3;
        this[15] = r3c3;


        return this;
    }

    /**
     * Set self to identity matrix.
     */
    public setToIdentity (): void 
    {
        this[0] = 1;
        this[1] = 0;
        this[2] = 0;
        this[3] = 0;

        this[4] = 0;
        this[5] = 1;
        this[6] = 0;
        this[7] = 0;

        this[8] = 0;
        this[9] = 0;
        this[10] = 1;
        this[11] = 0;

        this[12] = 0;
        this[13] = 0;
        this[14] = 0;
        this[15] = 1;
    }

    /**
     * Get the cofactor of matrix.
     */
    public cofactor (row: number, col: number): number
    {
        let sign = 1.0;

        // For cofactor rule is
        // | + - + - |
        // | - + - + |
        // | + - + - |
        // | - + - + |

        // if odd
        if ((row + col) % 2 == 1)
        {
            sign = -1.0;
        }

        const minor = this.minor(row, col);
        return minor * sign;
    }

    /**
     * Gets the minor matrix.
     */
    public minor (row: number, col: number): number
    {
        return this.subMatrix(row, col).determinant();
    }

    /**
     * Get the submatrix from matrix, excluding row and column.
     * Row and col are 0 based.
     */
    public subMatrix (row: number, col: number): Mat3x3F
    {
        if (row > 3)
        {
            row = 3;
        }
        if (col > 3)
        {
            col = 3;
        }

        const result = Mat3x3F.identity();

        let i = 0;
        let j = 0;

        for (let c = 0; c < 4; c++)
        {
            if (c == col) continue;
            for (let r = 0; r < 4; r++)
            {
                if (r == row) continue;

                // get value from mat4x4 and move it to appropriate 3x3 position. Be careful, [] returns pointer to places.
                result[j * 3 + i] = this[c * 4 + r];
                i++;
            }
            j++;
            i = 0;
        }

        return result;
    }

    /**
     * Get the determinant of matrix.
     */
    public determinant (): number
    {
        const a = this.cofactor(0, 0);
        const b = this.cofactor(0, 1);
        const c = this.cofactor(0, 2);
        const d = this.cofactor(0, 3);


        return this[0] * a + this[4] * b + this[8] * c + this[12] * d;
        // same as return this.R0C0 * a + this.R0C1 * b + this.R0C2 * c + this.R0C3 * d;
        // but above is bit faster.
    }

    /**
     * Multiplies matrix with vec3 and returns a vec3
     * @param { Vec3|Float32Array} v
     * @returns { Vec3 }
     */
    public multiplyWithVec3 (v: Vec3 | Float32Array): Vec3
    {
        // NOTE: careful here, skip last in rows !!!
        return new Vec3(
            this[0] * v[0] + this[4] * v[1] + this[8] * v[2],
            this[1] * v[0] + this[5] * v[1] + this[9] * v[2],
            this[2] * v[0] + this[6] * v[1] + this[10] * v[2]
        );
    }

    /**
     * Multiply matrix with vec4 and returns a vec4  
     * @param {Vec4} v
     * @returns { Vec4 } 
     */
    public multiplyWithVec4 (v: Vec4): Vec4 
    {
        return new Vec4(
            this[0] * v[0] + this[4] * v[1] + this[8] * v[2] + this[12] * v[3],
            this[1] * v[0] + this[5] * v[1] + this[9] * v[2] + this[13] * v[3],
            this[2] * v[0] + this[6] * v[1] + this[10] * v[2] + this[14] * v[3],
            this[3] * v[0] + this[7] * v[1] + this[11] * v[2] + this[15] * v[3]
        );
    }

    /**
     * Copies the matrix and returns copied instance.
     */
    public copy (): Mat4x4
    {
        return new Mat4x4(
            this[0], this[4], this[8], this[12],
            this[1], this[5], this[9], this[13],
            this[2], this[6], this[10], this[14],
            this[3], this[7], this[11], this[15],
        )
    }

    /**
     * Does matrix equals other matrix. Uses close comparison of integers.
     */
    public equals (other: Mat4x4): boolean
    {
        for (let i = 0; i < 16; i++)
        {
            if (Math.abs(this[i] - other[i]) > EPSILON)
            {
                return false;
            }
        }
        return true;
    }
    /**
     * Creates identity matrix.
     * @param { Mat4x4 | undefined } out 
     * @returns { Mat4x4 }
     */
    public static identity (out?: Mat4x4): Mat4x4 
    {
        if (!out)
        {
            return new Mat4x4(
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            );
        }

        out[0] = 1;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;

        out[4] = 0;
        out[5] = 1;
        out[6] = 0;
        out[7] = 0;

        out[8] = 0;
        out[9] = 0;
        out[10] = 1;
        out[11] = 0;

        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
        out[15] = 1;

        return out;
    }

    /**
   * Creates and returns zero matrix.
   */
    public static zero (): Mat4x4
    {
        return new Mat4x4(
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0
        );
    }

    /**
     * Create the translation matrix.
     * @param { number } x
     * @param { number } y
     * @param { number } z
     * @param { Mat4x4 | undefined } out 
     * @returns { Mat4x4 } 
     */
    public static translationMatrix (x: number, y: number, z: number, out?: Mat4x4): Mat4x4 
    {
        if (!out)
        {
            return new Mat4x4(
                1, 0, 0, x,
                0, 1, 0, y,
                0, 0, 1, z,
                0, 0, 0, 1
            );
        }

        out[0] = 1;
        out[4] = 0;
        out[8] = 0;
        out[12] = x;

        out[1] = 0;
        out[5] = 1;
        out[9] = 0;
        out[13] = y;

        out[2] = 0;
        out[6] = 0;
        out[10] = 1;
        out[14] = z;

        out[3] = 0;
        out[7] = 0;
        out[11] = 0;
        out[15] = 1;

        return out;
    }

    /**
     * Create the translation matrix from a vector.
     * @param { Vec3  } - vector to create translation matrix from.
     * @param { Mat4x4  undefined } out 
     * @returns { Vec3 }
     */
    public static translationMatrixFromVector (v: Vec3, out?: Mat4x4): Mat4x4 
    {
        return Mat4x4.translationMatrix(v[0], v[1], v[2], out);
    }

    /**
      * Create the scale matrix
      * @param { number } x
      * @param { number } y
      * @param { number } z
      */
    public static scaleMatrix (x: number, y: number, z: number, out?: Mat4x4): Mat4x4
    {
        if (!out)
        {
            return new Mat4x4(
                x, 0, 0, 0,
                0, y, 0, 0,
                0, 0, z, 0,
                0, 0, 0, 1
            );
        }

        out[0] = x;
        out[4] = 0;
        out[8] = 0;
        out[12] = 0;

        out[1] = 0;
        out[5] = y;
        out[9] = 0;
        out[13] = 0;

        out[2] = 0;
        out[6] = 0;
        out[10] = z;
        out[14] = 0;

        out[3] = 0;
        out[7] = 0;
        out[11] = 0;
        out[15] = 1;

        return out;
    }

    /**
    * Create the scale matrix from a vector.
    * @param { Vec3 | Float32Array } - vector to create scale matrix from.
    * @param { Mat4x4 | Float32Array | undefined } out 
    * @returns { Vec3 | Float32Array}
    */
    public static scaleMatrixFromVector (v: Vec3 | Float32Array, out?: Mat4x4): Mat4x4 
    {
        return Mat4x4.scaleMatrix(v[0], v[1], v[2], out);
    }


    /**
     * Create a rotation matrix 
     * @param { number } theta_in_radians
     * @param { Vec3 | Float32Array } axis
     * @param { Mat4x4 | Float32Array | undefined } out
     * @returns { Mat4x4 | Float32Array }
     */
    public static rotationMatrix (theta_in_radians: number, axis: Vec3 | Float32Array, out?: Mat4x4 | Float32Array): Mat4x4 | Float32Array
    {
        if (!out)
        {
            out = Mat4x4.identity();
        }

        // I3 = identity 3x3 matrix
        //											  | xx xy xz |              | 0 -z y |
        // R(a, theta) = cos(theta)I3 + (1-cos(theta) | xy yy yz | + sin(theta) | z 0 -x | 
        //											  | xz yz zz |              | -y x 0 |
        //					a		  +            b               +           c

        axis = Vec3.normalize(axis);

        // Unit vector components. Unit vector is v/|v|  where v is vector, and |v| is length of vector.
        const x = axis[0];
        const y = axis[1];
        const z = axis[2];

        // roughly pi/2
        const cos_theta = Math.cos(theta_in_radians);

        // same as cos(theta)I3
        const a = new Mat3x3F(
            cos_theta, 0, 0,
            0, cos_theta, 0,
            0, 0, cos_theta
        );

        //   		    		 | xx xy xz |            
        // same as (1-cos(theta) | xy yy yz |
        //						 | xz yz zz |            
        let s = 1.0 - cos_theta;
        const b = new Mat3x3F(
            x * x * s, x * y * s, x * z * s,
            x * y * s, y * y * s, y * z * s,
            x * z * s, y * z * s, z * z * s
        );


        //                    | 0 -z y |
        // same as sin(theta) | z 0 -x | 
        //                    | -y x 0 |
        s = Math.sin(theta_in_radians);
        const c = new Mat3x3F(
            0.0, -z * s, y * s,
            z * s, 0.0, -x * s,
            -y * s, x * s, 0.0);

        // You will change this return call
        const sum = a.add(b).add(c);
        return Mat4x4.fromMat3x3F(sum, out);
    }

    /**
     * Create a rotation matrix around x axis.
     * @param { number } angle_in_radians 
     * @param { Mat4x4 | Float32Array | undefined } out 
     * @returns { Mat4x4 | Float32Array }
     */
    public static rotationX (angle_in_radians: number, out?: Mat4x4 | Float32Array): Mat4x4 | Float32Array 
    {
        const cos = Math.cos(angle_in_radians);
        const sin = Math.sin(angle_in_radians);

        if (!out)
        {
            return new Mat4x4(
                1, 0, 0, 0,
                0, cos, -sin, 0,
                0, sin, cos, 0,
                0, 0, 0, 1);

        }

        out[0] = 1;
        out[4] = 0;
        out[8] = 0;
        out[12] = 0;

        out[1] = 0;
        out[5] = cos;
        out[9] = -sin;
        out[13] = 0;

        out[2] = 0;
        out[6] = sin;
        out[10] = cos;
        out[14] = 0;

        out[3] = 0;
        out[7] = 0;
        out[11] = 0;
        out[15] = 1;

        return out;
    }

    /**
    * Create a rotation matrix around y axis.
    * @param { number } angle_in_radians 
    * @param { Mat4x4 | Float32Array | undefined } out 
    * @returns { Mat4x4 | Float32Array }
    */
    public static rotationY (angle_in_radians: number, out?: Mat4x4 | Float32Array): Mat4x4 | Float32Array 
    {
        const cos = Math.cos(angle_in_radians);
        const sin = Math.sin(angle_in_radians);

        if (!out)
        {
            return new Mat4x4(
                cos, 0, sin, 0,
                0, 1, 0, 0,
                -sin, 0, cos, 0,
                0, 0, 0, 1);

        }

        out[0] = cos;
        out[4] = 0;
        out[8] = sin;
        out[12] = 0;

        out[1] = 0;
        out[5] = 1;
        out[9] = 0;
        out[13] = 0;

        out[2] = -sin;
        out[6] = 0;
        out[10] = cos;
        out[14] = 0;

        out[3] = 0;
        out[7] = 0;
        out[11] = 0;
        out[15] = 1;

        return out;
    }

    /**
    * Create a rotation matrix around z axis.
    * @param { number } angle_in_radians 
    * @param { Mat4x4 | Float32Array | undefined } out 
    * @returns { Mat4x4 | Float32Array }
    */
    public static rotationZ (angle_in_radians: number, out?: Mat4x4 | Float32Array): Mat4x4 | Float32Array 
    {
        const cos = Math.cos(angle_in_radians);
        const sin = Math.sin(angle_in_radians);

        if (!out)
        {
            return new Mat4x4(
                cos, -sin, 0, 0,
                sin, cos, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1);

        }

        out[0] = cos;
        out[4] = -sin;
        out[8] = 0;
        out[12] = 0;

        out[1] = sin;
        out[5] = cos;
        out[9] = 0;
        out[13] = 0;

        out[2] = 0;
        out[6] = 0;
        out[10] = 1;
        out[14] = 0;

        out[3] = 0;
        out[7] = 0;
        out[11] = 0;
        out[15] = 1;

        return out;
    }

    /**
     * Create new 4x4 matrix from 3x3 matrix
     * @param { Mat3x3F | Float32Array } m
     * @param { Mat4x4 | Float32Array | undefined }
     * @returns { Mat4x4 | Float32Array }
     */
    public static fromMat3x3F (m: Mat3x3F, out?: Mat4x4 | Float32Array): Mat4x4 | Float32Array
    {
        if (!out)
        {
            return new Mat4x4(
                m[0], m[3], m[6], 0,
                m[1], m[4], m[7], 0,
                m[2], m[5], m[8], 0,
                0, 0, 0, 1
            );
        }

        out[0] = m[0];
        out[4] = m[3];
        out[8] = m[6];
        out[12] = 0;

        out[1] = m[1];
        out[5] = m[4];
        out[9] = m[7];
        out[13] = 0;

        out[2] = m[2];
        out[6] = m[5];
        out[10] = m[8];
        out[14] = 0;

        out[3] = 0;
        out[7] = 0;
        out[11] = 0;
        out[15] = 1;

        return out;
    }

    /**
     * Transpose a matrix and returns new copy.
     * @param { Mat4x4 | Float32Array }
     * @returns { Mat4x4 | Float32Array }
     */
    public static transpose (m: Mat4x4 | Float32Array): Mat4x4 | Float32Array
    {
        return new Mat4x4(
            m[0], m[1], m[2], m[3],
            m[4], m[5], m[6], m[7],
            m[8], m[9], m[10], m[11],
            m[12], m[13], m[14], m[15]
        );
    }

    /**
     * Get the determinant of matrix.
     * @param { Mat4x4 | Float32Array } m
     * @returns { number }
     */
    public static determinant (m: Mat4x4 | Float32Array): number
    {
        const a = Mat4x4.cofactor(m, 0, 0);
        const b = Mat4x4.cofactor(m, 0, 1);
        const c = Mat4x4.cofactor(m, 0, 2);
        const d = Mat4x4.cofactor(m, 0, 3);


        return m[0] * a + m[4] * b + m[8] * c + m[12] * d;
        // same as return this.R0C0 * a + this.R0C1 * b + this.R0C2 * c + this.R0C3 * d;
        // but above is bit faster.
    }

    /**
      * Get the cofactor of matrix.
      * @param { Mat4x4 | Float32Array } m
      * @param { number } row 
      * @param { number } col
      * @returns { number }
      */
    public static cofactor (m: Mat4x4 | Float32Array, row: number, col: number): number
    {
        let sign = 1.0;

        // For cofactor rule is
        // | + - + - |
        // | - + - + |
        // | + - + - |
        // | - + - + |

        // if odd
        if ((row + col) % 2 == 1)
        {
            sign = -1.0;
        }

        const minor = Mat4x4.minor(m, row, col);
        return minor * sign;
    }


    /**
     * Get the submatrix from matrix, excluding row and column.
     * Row and col are 0 based.
     * @param { Mat4x4 | Float32Array } m
     * @param { number } row 
     * @param { number } col
     * @return { Mat3x3F | Float32Array }
     */
    public static subMatrix (m: Mat4x4 | Float32Array, row: number, col: number): Mat3x3F | Float32Array 
    {
        if (row > 3)
        {
            row = 3;
        }
        if (col > 3)
        {
            col = 3;
        }

        const result = Mat3x3F.identity();

        let i = 0;
        let j = 0;

        for (let c = 0; c < 4; c++)
        {
            if (c == col) continue;
            for (let r = 0; r < 4; r++)
            {
                if (r == row) continue;

                // get value from mat4x4 and move it to appropriate 3x3 position. Be careful, [] returns pointer to places.
                result[j * 3 + i] = m[c * 4 + r];
                i++;
            }
            j++;
            i = 0;
        }

        return result;
    }

    /**
    * Gets the minor of a matrix.
     * @param { Mat4x4 | Float32Array } m
     * @param { number } row 
     * @param { number } col
     * @returns { number }
     */
    public static minor (m: Mat4x4 | Float32Array, row: number, col: number): number
    {
        return Mat3x3F.determinant(Mat4x4.subMatrix(m, row, col));
    }

    /**
     * Returns the inverse of matrix.
     * @param { Mat4x4 | Float32Array } m 
     * @param { Mat4x4 | Float32Array | undefined } out 
     * @returns { Mat4x4 | Float32Array }
     */
    public static inverse (m: Mat4x4 | Float32Array, out?: Mat4x4 | Float32Array): Mat4x4 | Float32Array
    {
        if (!out)
        {
            out = Mat4x4.identity();
        }

        const d = Mat4x4.determinant(m); //  m.determinant();

        for (let c = 0; c < 4; c++)
        {
            for (let r = 0; r < 4; r++)
            {
                const cofactor = Mat4x4.cofactor(m, r, c);

                // note the fliped for col in index
                out[r * 4 + c] = cofactor / d;
            }
        }

        return out;
    }

    /**
     * Multiply matrix by 3x1 vector. While this is invalid operation with matrices,
     * here vec3 is simply considered to be vec4 with w component being set to 0.
     * @param { Mat4x4 | Float32Array } m 
     * @param { Vec3 | Float32Array } v 
     * @returns { Vec3 }
     */
    public static multiplyWithVec3 (m: Mat4x4 | Float32Array, v: Vec3 | Float32Array): Vec3
    {
        return new Vec3(
            m[0] * v[0] + m[4] * v[1] + m[8] * v[2],
            m[1] * v[0] + m[5] * v[1] + m[9] * v[2],
            m[2] * v[0] + m[6] * v[1] + m[10] * v[2]
        );

        /** Should be same as 
         * 	m.R0C0 * v.X + m.R0C1 * v.Y + m.R0C2 * v.Z;
         *  m.R1C0 * v.X + m.R1C1 * v.Y + m.R1C2 * v.Z;
         *  m.R2C0 * v.X + m.R2C1 * v.Y + m.R2C2 * v.Z;
         */
    }

    /**
     * Multiplies the matrix by vector 4 and returns a new vector.
     * @param { Mat4x4|Float32Array} a multiplication matrix
     * @param { Vec4|Float32Array} b vector to multiply with
     * @param { Vec4|Float32Array} out - out vector if passed in. If it's not passed in new Vec4 is created and returns.
     * @returns { Vec4|Float32Array} - if out is of type Float32Array, Float32Array is returned, otherwise Mat4x4 is returned.
     */
    public static multiplyWithVec4 (m: Mat4x4 | Float32Array, v: Vec4 | Float32Array, out?: Vec4 | Float32Array): Vec4
    {
        if (!out)
        {
            out = Vec4.zero();
        }

        const x = m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12] * v[3];
        const y = m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13] * v[3];
        const z = m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3];
        const w = m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3];

        out[0] = x;
        out[1] = y;
        out[2] = z;
        out[3] = w;

        /** Should be same as 
         * 	m.R0C0 * v.X + m.R0C1 * v.Y + m.R0C2 * v.Z * m.R0C3 + v.W;
         *  m.R1C0 * v.X + m.R1C1 * v.Y + m.R1C2 * v.Z * m.R1C3 + v.W;
         *  m.R2C0 * v.X + m.R2C1 * v.Y + m.R2C2 * v.Z * m.R2C3 + v.W;
         *  m.R3C0 * v.X + m.R3C1 * v.Y + m.R3C2 * v.Z * m.R3C3 + v.W;
         */

        return out as Vec4;
    }

    /**
     * Multiply matrix by matrix, or at least by Float32Array of 16 elements.
     * @param { Mat4x4|Float32Array } a 
     * @param { Mat4x4|Float32Array} b
     * @param { Mat4x4|Float32Array} out - optional nullable out matrix, if defined result is set to that matrix, otherwise internally new matrix is created and returns.
     * @returns { Mat4x4|Float32Array } please not that if Float32Array is passed as out, it is also returned
     * NOTE: it out parameters it Float32Array it is also returned as Float32Array.
     */
    public static multiply (a: Mat4x4 | Float32Array, b: Mat4x4 | Float32Array, out?: Mat4x4 | Float32Array): Mat4x4
    {
        if (!out)
        {
            out = Mat4x4.zero();
        }

        const r0c0 = a[0] * b[0] + a[4] * b[1] + a[8] * b[2] + a[12] * b[3];
        const r0c1 = a[0] * b[4] + a[4] * b[5] + a[8] * b[6] + a[12] * b[7];
        const r0c2 = a[0] * b[8] + a[4] * b[9] + a[8] * b[10] + a[12] * b[11];
        const r0c3 = a[0] * b[12] + a[4] * b[13] + a[8] * b[14] + a[12] * b[15];

        const r1c0 = a[1] * b[0] + a[5] * b[1] + a[9] * b[2] + a[13] * b[3];
        const r1c1 = a[1] * b[4] + a[5] * b[5] + a[9] * b[6] + a[13] * b[7];
        const r1c2 = a[1] * b[8] + a[5] * b[9] + a[9] * b[10] + a[13] * b[11];
        const r1c3 = a[1] * b[12] + a[5] * b[13] + a[9] * b[14] + a[13] * b[15];

        const r2c0 = a[2] * b[0] + a[6] * b[1] + a[10] * b[2] + a[14] * b[3];
        const r2c1 = a[2] * b[4] + a[6] * b[5] + a[10] * b[6] + a[14] * b[7];
        const r2c2 = a[2] * b[8] + a[6] * b[9] + a[10] * b[10] + a[14] * b[11];
        const r2c3 = a[2] * b[12] + a[6] * b[13] + a[10] * b[14] + a[14] * b[15];

        const r3c0 = a[3] * b[0] + a[7] * b[1] + a[11] * b[2] + a[15] * b[3];
        const r3c1 = a[3] * b[4] + a[7] * b[5] + a[11] * b[6] + a[15] * b[7];
        const r3c2 = a[3] * b[8] + a[7] * b[9] + a[11] * b[10] + a[15] * b[11];
        const r3c3 = a[3] * b[12] + a[7] * b[13] + a[11] * b[14] + a[15] * b[15];

        out[0] = r0c0;
        out[4] = r0c1;
        out[8] = r0c2;
        out[12] = r0c3;

        out[1] = r1c0;
        out[5] = r1c1;
        out[9] = r1c2;
        out[13] = r1c3;

        out[2] = r2c0;
        out[6] = r2c1;
        out[10] = r2c2;
        out[14] = r2c3;

        out[3] = r3c0;
        out[7] = r3c1;
        out[11] = r3c2;
        out[15] = r3c3;

        return out as Mat4x4;
    }


    /**
     * Create the new matrix instance from array.
     * @param { ArrayLike<number> } arr
     * @param { Mat4x4 | Float32Array | undefined } out  
     * @returns { Mat4x4 | Float32Array }
     */
    public static fromArray (arr: ArrayLike<number>, out?: Mat4x4 | Float32Array): Mat4x4 | Float32Array
    {
        if (!out)
        {
            out = Mat4x4.identity();
        }

        // by some calcs, while is faster
        let l = 16;
        while (l != 0)
        {
            l--;
            out[l] = arr[l];
        }
        return out;
    }


    /**
     * Create the perspective camera.
     * @param { number } fov_radians - field of view
     * @param { number } aspect_ratio
     * @param { number } z_near - near clipping plane
     * @param { number } z_far - far clipping plane 
     * @return { Mat4x4 }
     */
    public static perspective (fov_radians: number, aspect_ratio: number, z_near: number, z_far: number): Mat4x4
    {
        const a = 1.0 / Math.tan(fov_radians / 2);
        return new Mat4x4(
            a / aspect_ratio, 0, 0, 0,
            0, a, 0, 0,
            0, 0, -(z_far + z_near) / (z_far - z_near), -(2.0 * z_far * z_near) / (z_far - z_near),
            0, 0, -1.0, 0);
    }

    /**
     * Create orthographic projection matrix.
     * @param { number } left 
     * @param { number } right 
     * @param { number } bottom 
     * @param { number } top 
     * @param { number } z_near 
     * @param { number } z_far 
     * @returns { Mat4x4  }
     */
    public static orthographic (left: number, right: number, bottom: number, top: number, z_near: number, z_far: number): Mat4x4 
    {
        // http://learnwebgl.brown37.net/08_projections/projections_ortho.html

        // width
        let w = right - left;

        // height
        let h = top - bottom;

        // depth
        let z = z_far - z_near;

        return new Mat4x4(
            2 / w, 0, 0, -((right + left) / w),
            0, 2 / h, 0, -((top + bottom) / h),
            0, 0, -2 / z, -((z_near + z_far) / z),
            0, 0, 0, 1);
    }

    /**
     * Create the look at camera.
     * @param { Vec3 } eye 
     * @param { Vec3 } center 
     * @param { Vec3 } up 
     * @returns { Mat4x4 }
     */
    public static lookAt (eye: Vec3, center: Vec3, up: Vec3, out?: Mat4x4): Mat4x4 
    {
        // Steps
        // 1. Create a coordinate frame for the camera
        // 2. Define a rotation matrix
        // 3. Apply appropriate translation for camera ( eye ) location

        //      a          b x w
        // w = ---    u = -------       v = w x u
        //    ||a||     || b x w ||

        // a = eye - center 
        // therfore w is a / || a || or unit a
        const w = Vec3.subtract(eye, center);
        Vec3.normalize(w, w);

        const u = Vec3.cross(up, w);
        Vec3.normalize(u, u);

        const v = Vec3.cross(w, u);

        if (!out)
        {
            out = Mat4x4.identity();
        }

        out[0] = u[0];
        out[4] = u[1];
        out[8] = u[2];
        out[12] = -Vec3.dot(eye, u);

        out[1] = v[0];
        out[5] = v[1];
        out[9] = v[2];
        out[13] = -Vec3.dot(eye, v);

        out[2] = w[0];
        out[6] = w[1];
        out[10] = w[2];
        out[14] = -Vec3.dot(eye, w);

        return out;
    }

    /**
     * Move all the matrices to an signed array.
     * @param matrices 
     * @returns 
     */
    public static matricesArrayToSignedArray (matrices: Array<Mat4x4>): Float32Array 
    {
        const signedArray = new Float32Array(matrices.length * 16);

        let offset  = 0;
        for (let i = 0; i < matrices.length; i++)
        {
            signedArray.set(matrices[i], offset);
            offset += 16;
        }

        return signedArray;
    }

    /**
     * String representation of matrix.
     */
    public ToString (): string
    {
        return `
             | ${this.r0c0} ${this.r0c1} ${this.r0c2} ${this.r0c3} |\n
             | ${this.r1c0} ${this.r1c1} ${this.r1c2} ${this.r1c3} |\n
             | ${this.r2c0} ${this.r2c1} ${this.r2c2} ${this.r2c3} |\n
             | ${this.r3c0} ${this.r3c1} ${this.r3c2} ${this.r3c3} |\n
         `;
    }
}