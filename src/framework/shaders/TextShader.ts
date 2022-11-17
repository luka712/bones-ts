import { Mat4x4, Color } from "../bones_math";
import { Shader } from "./Shader";

/**
 * @brief The shader for simple text rendering.
 */
 export abstract class TextShader extends Shader
 {
   /**
    * Use the projection and view matrix.
    *
    * @param { Mat4x4 } projection_matrix
    * @param { Mat4x4 } view_matrix
    */
   public abstract useCamera (projection_matrix: Mat4x4, view_matrix: Mat4x4): void;
 
   /**
    * Use the transform matrix.
    *
    * @param { Mat4x4 } transform_matrix
    */
    public abstract useTransform (transform_matrix: Mat4x4): void;
 
   /**
    * Set the color of a font.
    *
    * @param { Color } color
    */
    public abstract useColor (color: Color): void;
 }