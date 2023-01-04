import { VERSION } from "ts-node";
import { BaseMatrix } from "../BaseMatrix";
import { Vec2 } from "../vec/Vec2";

/**
 * The matrix 2x2 class.
 */
export class Mat2x2 extends BaseMatrix<Mat2x2>
{
    constructor(
        r0c0: number, r0c1: number,
        r1c0: number, r1c1: number
    )
    {
        super(4);

        // column index
        let col = 0;
        this[col + 0] = r0c0;
        this[col + 1] = r1c0;

        col = 2;
        this[col + 0] = r0c1;
        this[col + 1] = r1c1;
    }

    // first col
    public get R0C0 (): number { return this[0]; }
    public get R1C0 (): number { return this[1]; }

    // second col
    public get R0C1 (): number { return this[2]; }
    public get R1C1 (): number { return this[3]; }

    /**
     * The determinant of matrix.
     */
    public determinant (): number
    {
        return this[0] * this[3] - this[1] * this[2];
    }

    /**
     * Creates and returns identity matrix.
     */
    public static identity (): Mat2x2
    {
        return new Mat2x2(1, 0,
            0, 1);
    }

    /**
     * Returns the determinant of a matrix.
     * @param { Mat2x2 | Float32Array } m 
     * @returns { number }
     */
    public static determinant (m: Mat2x2 | Float32Array): number 
    {
        return m[0] * m[3] - m[1] * m[2];
    }

    /**
     * Creates a rotation matrix.
     * @param theta_in_radians - theta in radians.
     * @param out - optional, if passed in, result is saved to out mat2x2.
     * @returns - {@link Mat2x2}
     */
    public static rotationMatrix (theta_in_radians: number, out?: Mat2x2): Mat2x2 
    {
        out = out ?? new Mat2x2(
            1, 0,
            0, 1);

        // col row
        const cos = Math.cos(theta_in_radians);
        const sin = Math.sin(theta_in_radians);
        
        out[0] = cos;
        out[2] = -sin;

        out[1] = sin;
        out[3] = cos;

        return out;
    }

}