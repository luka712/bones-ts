import { Mat4x4 } from "../bones_math";

export abstract class Camera 
{
    /**
     * The projection matrix. 
     * @note Do not modify this. It is modified by camera class.
     */
    protected m_projectionMatrix: Mat4x4;

    /**
     * The view matrix. 
     * @note Do not modify this. It is modified by camera class.
     */
    protected m_viewMatrix: Mat4x4;

    /**
     * The projection view matrix.
     * @note Do not modify this. It is modified by camera class.
     */
    projectionViewMatrix: Mat4x4 = Mat4x4.identity();

    public abstract update(deltaTime: number) : void;

}