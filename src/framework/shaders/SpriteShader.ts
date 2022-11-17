import { Color, Mat4x4 } from "../bones_math";
import { Shader } from "./Shader";

/**
 * The sprite shader interface.
 */
export abstract class SpriteShader extends Shader
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
     * Sets the tint color.
     * 
     * @param { Color } color 
     */
    public abstract useTintColor (color: Color): void;
}