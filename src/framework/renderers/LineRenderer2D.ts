import { Mat4x4, Vec3 } from "../bones_math";

/**
 * Defines look of join between lines.
 */
export enum LineJoin 
{
    /**
     * Join between lines edges is round.
     */
    ROUND,

    /**
     * Join between lines edges is extended up until intersection.
     */
    MITER, 

    /**
     * Join between lines edges is flattened out.
     */
    BEVEL,

    /**
     * User defined line join, if one is provided.
     */
    CUSTOM,
}

/**
 * The 2d line renderer.
 */
export abstract class LineRenderer2D 
{

    /**
     * @brief The projection matrix.
     */
    protected m_projectionMatrix: Mat4x4;

    /**
     * @brief The view matrix.
     */
    protected m_viewMatrix: Mat4x4;

    /**
     * @brief Initialize the sprite batch manager. Initialize must be called in order to properly initialize all the variables.
     */
    public abstract initialize (): void;

    /**
     * @brief Resize the sprite renderer.
     * CAUTION: Ideally this should be set to renderer width and height, but can be done otherwise.
     * Not setting it to renderer width and height might lead to some undesired behaviour.
     *
     * @param { number } width - new width.
     * @param { number } height - new height.
     */
    public resize (width: number, height: number): void 
    {
        this.m_projectionMatrix = Mat4x4.orthographic(0, width, height, 0, -1, 1) as Mat4x4;
        this.m_viewMatrix = Mat4x4.lookAt(Vec3.zero(), Vec3.negativeUnitZ(), Vec3.unitY()) as Mat4x4;
    }
}