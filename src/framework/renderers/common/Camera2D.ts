import { Mat4x4, Vec3 } from "../../bones_math";

/**
 * Helper class for working with camera. 
 * Used by 2d renderers which need to fit the screen.
 */
export class Camera2D 
{
    /**
       * @brief The projection matrix.
       */
    public static projectionMatrix: Mat4x4;

    /**
     * @brief The view matrix.
     */
    public static viewMatrix: Mat4x4;

    /**
     * @brief Resize the line renderer.
     * CAUTION: Ideally this should be set to renderer width and height, but can be done otherwise.
     * Not setting it to renderer width and height might lead to some undesired behaviour.
     *
     * @param { number } width - new width.
     * @param { number } height - new height.
     */
    public static resize (width: number, height: number): void 
    {
        Camera2D.projectionMatrix = Mat4x4.orthographic(0, width, height, 0, -1, 1) as Mat4x4;
        Camera2D.viewMatrix = Mat4x4.lookAt(Vec3.zero(), Vec3.negativeUnitZ(), Vec3.unitY()) as Mat4x4;
    }
}