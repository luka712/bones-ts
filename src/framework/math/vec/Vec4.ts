import { EPSILON } from "../../bones_common";
import { Vec3 } from "./Vec3";


/**
 * The vec 4 class.
 */
 export class Vec4 extends Float32Array
 {
     constructor(x: number, y: number, z: number, w: number = 0)
     {
         super(4);
         this[0] = x;
         this[1] = y;
         this[2] = z;
         this[3] = w;
     }
 
     public get X(): number { return this[0]; }
     public get Y(): number { return this[1]; }
     public get Z(): number { return this[2]; }
     public get W(): number { return this[3]; }
 
     /**
      * returns new vec3 and ignores W component.
      */
     public ToVec3(): Vec3
     {
         return new Vec3(this[0], this[1], this[2]);
     }
 
     /**
      * Returns copy of vec4.
      */
     public copy(): Vec4
     {
         return new Vec4(this[0], this[1], this[2], this[3]);
     }
 
     /**
      * Does current vector has same values as other one.
      */
     public Equals(other: Vec4): boolean
     {
         return (Math.abs(this[0]) - Math.abs(other[0])) < EPSILON &&
             (Math.abs(this[1]) - Math.abs(other[1])) < EPSILON &&
             (Math.abs(this[2]) - Math.abs(other[2])) < EPSILON &&
             (Math.abs(this[3]) - Math.abs(other[3])) < EPSILON;
     }
 
     /**
      * Creates and returns an instance of Vec4 with components being set to 0
      * @param { Vec4 }
      */
     public static zero(): Vec4
     {
         return new Vec4(0, 0, 0, 0);
     }
 
     /**
      * Create the Vec3 from Vec4 
      * @param { Vec3 | Float32Array } v
      * @param { number } w
      * @returns { Vec4 |Float32Array }
     {
      */
     public static fromVec3(v: Vec3 | Float32Array, w: number): Vec4 | Float32Array 
     {
         return new Vec4(v[0], v[1], v[2], w);
     }
 
     /**
      * Add vec3 to vec4 and simply copies w component.
      * @param { Vec4 | Float32Array } a 
      * @param { Vec3 | Float32Array } b
      * @returns { Vec4 }
      */
     public static addVec3(a: Vec4 | Float32Array, b: Vec3 | Float32Array): Vec4
     {
         return new Vec4(
             a[0] + b[0],
             a[1] + b[1],
             a[2] + b[2],
             a[3]
         );
     }
 }