import { Mat4x4 } from "../bones_math";

export abstract class Camera 
{
    /**
     * The projection matrix.
     */
    projectionMatrix: Mat4x4;

    /**
     * The view matrix.
     */
    viewMatrix: Mat4x4;

    // only used really internally.
    projectionViewMatrix: Mat4x4 = Mat4x4.identity();

    public abstract update(deltaTime: number) : void;

}