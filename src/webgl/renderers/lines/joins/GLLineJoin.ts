import { Mat4x4, Color } from "../../../../framework/bones_math";

/**
 * Interface used by {@link GLLineRenderer2D} which is used to define line joins.
 */
export interface GLLineJoin
{
    /**
     * Initialize a line join. This should setup buffers and shaders.
     * @param gl - the gl context.
     * @param points_buffer - the line buffer which defines point attributes. 
     */
    initialize (gl: WebGL2RenderingContext, points_buffer: WebGLBuffer): Promise<void>;

    /**
     * The draw method. Should call appropriate gl draw calls.
     * @param n_of_line_instances - the current number of line instances. 
     * @param projection_matrix - the projection matrix from {@link GLLineRenderer2D}
     * @param view_matrix - the view matrix from {@link GLLineRenderer2D}
     * @param width - the width of a line from {@link GLLineRenderer2D}
     * @param color - the color of a line from {@link GLLineRenderer2D}
     */
     draw(n_of_line_instances: number, projection_matrix: Mat4x4, view_matrix: Mat4x4, width: number, color: Color) : void;
}