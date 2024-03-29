import { Mat4x4, Vec3 } from "../../bones_math";

/**
 * Helper class for working with camera. 
 * Used by 2d renderers which need to fit the screen such as sprite renderer, 2d line renderer etc...
 */
export class Camera2D 
{
    /**
       * @brief The projection view matrix.
       */
    public static projectionViewMatrix: Mat4x4 = Mat4x4.identity()


    /**
     * @brief Resize the camera matrices.
     * CAUTION: Ideally this should be set to renderer width and height, but can be done otherwise.
     * Not setting it to renderer width and height might lead to some undesired behaviour.
     *
     * @param { number } width - new width.
     * @param { number } height - new height.
     */
    public static resize (width: number, height: number): void 
    {
        const projectionMatrix = Mat4x4.orthographic(0, width, height, 0, -1, 1) as Mat4x4;
        const viewMatrix = Mat4x4.lookAt(Vec3.zero(), Vec3.negativeUnitZ(), Vec3.unitY()) as Mat4x4;

        this.projectionViewMatrix = projectionMatrix.multiply(viewMatrix);
    }
}