import { BaseMatrix } from "../BaseMatrix";
import { Mat2x2F } from "./Mat2x2F";

/**
 * The matrix 3x3 class.
 */
 export class Mat3x3F extends BaseMatrix<Mat3x3F>
 {
     constructor(
         r0c0: number, r0c1: number, r0c2: number,
         r1c0: number, r1c1: number, r1c2: number,
         r2c0: number, r2c1: number, r2c2: number
     )
     {
         super(9);
 
         // column index
         let col = 0;
         this[col + 0] = r0c0;
         this[col + 1] = r1c0;
         this[col + 2] = r2c0;
 
         col = 3;
         this[col + 0] = r0c1;
         this[col + 1] = r1c1;
         this[col + 2] = r2c1;
 
         col = 6;
         this[col + 0] = r0c2;
         this[col + 1] = r1c2;
         this[col + 2] = r2c2;
     }
 
     // first col
     public get R0C0(): number { return this[0]; }
     public get R1C0(): number { return this[1]; }
     public get R2C0(): number { return this[2]; }
 
     // second col
     public get R0C1(): number { return this[3]; }
     public get R1C1(): number { return this[4]; }
     public get R2C1(): number { return this[5]; }
 
     // third col
     public get R0C2(): number { return this[6]; }
     public get R1C2(): number { return this[7]; }
     public get R2C2(): number { return this[8]; }
 
 
 
     /**
      * Gets the minor of matrix.
      */
     public minor(row: number, col: number): number
     {
         return this.subMatrix(row, col).determinant();
     }
 
     /**
      * Returns submatrix 2x2 of submatrix 3x3.
      * Passed in row and column are ignored.
      */
     public subMatrix(row: number, col: number): Mat2x2F
     {
         if (row > 2)
         {
             row = 2;
         }
         if (col > 2)
         {
             col = 2;
         }
 
         const result = Mat2x2F.identity();
 
         let i = 0;
         let j = 0;
 
         for (let c = 0; c < 3; c++)
         {
             if (c == col) continue;
             for (let r = 0; r < 3; r++)
             {
                 if (r == row) continue;
 
                 // get value from mat3x3 and move it to appropriate 2x2 position. 
                 result[j * 2 + i] = this[c * 3 + r];
                 i++;
             }
             j++;
             i = 0;
         }
 
         return result;
     }
 
     public cofactor(row: number, col: number): number 
     {
         let sign = 1;
 
         // For cofactor rule is
         // | + - + |
         // | - + - |
         // | + - + |
 
         // if odd
         if ((row + col) % 2 == 1)
         {
             sign = -1;
         }
 
         let minor = this.minor(row, col);
         let result = minor * sign;
         return result;
     }
 
     /**
      * The matrix determinant.
      */
     public determinant(): number
     {
         const a = this.cofactor(0, 0);
         const b = this.cofactor(0, 1);
         const c = this.cofactor(0, 2);
 
         return this[0] * a + this[3] * b + this[6] * c;
         // same as return this.R0C0 * a + this.R0C1 * b + this.R0C2 * c;
         // BUT first way is bit faster.
     }
 
     /**
      * The identity 3x3 matrix.
      */
     static identity(): Mat3x3F
     {
         return new Mat3x3F(
             1, 0, 0,
             0, 1, 0,
             0, 0, 1
         );
     }
 
     /**
      * Returns the determinant of a matrix.
      * @param { Mat2x2F | Float32Array } m 
      * @returns { number }
      */
     public static determinant(m: Mat3x3F | Float32Array): number
     {
         const a = Mat3x3F.cofactor(m, 0, 0);
         const b = Mat3x3F.cofactor(m, 0, 1);
         const c = Mat3x3F.cofactor(m, 0, 2);
 
         return m[0] * a + m[3] * b + m[6] * c;
         // same as return this.R0C0 * a + this.R0C1 * b + this.R0C2 * c;
         // BUT first way is bit faster.
     }
 
     /**
      * return cofactor of a matrix 
      * @param { Mat3x3F | Float32Array } m
      * @param { number } row
      * @param { number } col 
      * @return { number } 
      */
     public static cofactor(m: Mat3x3F | Float32Array, row: number, col: number): number 
     {
         let sign = 1;
 
         // For cofactor rule is
         // | + - + |
         // | - + - |
         // | + - + |
 
         // if odd
         if ((row + col) % 2 == 1)
         {
             sign = -1;
         }
 
         let minor = Mat3x3F.minor(m, row, col);
         let result = minor * sign;
         return result;
     }
 
 
     /**
      * Gets the minor of matrix.
      * @param { Mat3x3F | Float32Array } m
      * @param { number } row
      * @param { number } col
      * @returns { number } 
      */
     public static minor(m: Mat3x3F | Float32Array, row: number, col: number): number
     {
         return Mat2x2F.determinant(Mat3x3F.subMatrix(m, row, col));
     }
 
 
     /**
      * Returns submatrix 2x2 of submatrix 3x3.
      * Passed in row and column are ignored.
      * @param { Mat3x3F | Float32Array } m
      * @param { number } row
      * @param { number } col
      * @returns { Mat2x2F | Float32Array } 
      */
     public static subMatrix(m: Mat3x3F | Float32Array, row: number, col: number): Mat2x2F | Float32Array
     {
         if (row > 2)
         {
             row = 2;
         }
         if (col > 2)
         {
             col = 2;
         }
 
         const result = Mat2x2F.identity();
 
         let i = 0;
         let j = 0;
 
         for (let c = 0; c < 3; c++)
         {
             if (c == col) continue;
             for (let r = 0; r < 3; r++)
             {
                 if (r == row) continue;
 
                 // get value from mat3x3 and move it to appropriate 2x2 position. 
                 result[j * 2 + i] = m[c * 3 + r];
                 i++;
             }
             j++;
             i = 0;
         }
 
         return result;
     }
 }