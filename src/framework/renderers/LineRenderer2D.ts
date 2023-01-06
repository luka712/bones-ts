import { Color, Mat4x4, Vec2, Vec3 } from "../bones_math";

/**
 * Defines look of join between lines.
 */
export enum LineJoinType 
{
    /**
     * Don't use any line join.
     */
    NONE,

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

export enum LineCapsType 
{
    /**
     * No line cap.
     */
    NONE,

    /**
     * Line endings are round.
     */
    ROUND,

    /**
     * The square line caps
     */
    SQUARE,

    /**
     * The custom line caps.
     */
    CUSTOM, 
}

/**
 * Provides additional contextual data to draw method.
 */
export interface LineDrawAdditionalContext 
{
    /**
     * Does drawn line has a stroke.
     */
    readonly hasStroke: boolean;

    /**
     * Is currently drawn line a stroke line? 
     */
    readonly isStroke: boolean;

    /**
     * The stroke line width, which is width of inner line + stroke width.
     */
    readonly strokeLineWidth: number;
}

/**
 * The line join contract.
 */
export interface GLLineJoin 
{
    /**
     * Initialize a line join. This should setup buffers and shaders.
     * @param gl - the gl context.
     * @param points_buffer - the line buffer which defines point attributes.
     * 
     * @summary 
     * Buffer is described with 2 floating vec2 attributes, standing for line start point A and line start point B.
     * Simply put buffer will contain:
     * [0,0,1,0] - for line defined by point a(0,0) and b(1,0)
     * [1,0,1,1] - for line defined by point a(1,0) and b(1,1) 
     * etc... 
     */
    initialize (gl: WebGL2RenderingContext, points_buffer: WebGLBuffer): Promise<void>;

    /**
     * The draw method. Should call appropriate gl draw calls.
     * @param n_of_line_instances - the current number of line instances. 
     * @param projection_matrix - the projection matrix from {@link GLLineRenderer2D}
     * @param view_matrix - the view matrix from {@link GLLineRenderer2D}
     * @param width - the width of a line from {@link GLLineRenderer2D}
     * @param color - the color of a line from {@link GLLineRenderer2D}
     * @param ctx - the additional contextual data about a drawn line. Such as if currently drawn line represents stroke or not, is is a stroke line etc...
     */
    draw (n_of_line_instances: number, projection_matrix: Mat4x4, view_matrix: Mat4x4, width: number, color: Color, ctx: LineDrawAdditionalContext): void;
}

/**
 * Interface used by {@link GLLineRenderer2D} which is used to define line caps.
 */
export interface GLLineCaps
{
    /**
     * Initialize a line caps. This should setup buffers and shaders.
     * @param gl - the gl context.
     */
    initialize (gl: WebGL2RenderingContext): Promise<void>;

    /**
     * The draw method. Should call appropriate gl draw calls.
     * @param points - the points of line from {@link GLLineRenderer2D} 
     * @param projection_matrix - the projection matrix from {@link GLLineRenderer2D}
     * @param view_matrix - the view matrix from {@link GLLineRenderer2D}
     * @param width - the width of a line from {@link GLLineRenderer2D}
     * @param color - the color of a line from {@link GLLineRenderer2D}
     * @param ctx - the additional contextual data about a drawn line. Such as if currently drawn line represents stroke or not, is is a stroke line etc...
     */
    draw (points: Array<Vec2>, projection_matrix: Mat4x4, view_matrix: Mat4x4, width: number, color: Color, ctx: LineDrawAdditionalContext): void;
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
     * Add a custom type of a line join. To be used when {@link LineJoinType.CUSTOM} is passed in.
     * @param join - the line join implementation.
     */
    public abstract useCustomLineJoin (join: GLLineJoin): Promise<void>;

    /**
     * Add a custom type of a line cups. To be used when {@link LineCupsType.CUSTOM} is passed in.
     * @param caps - the line cups implementation.
     */
    public abstract useCustomLineCaps(caps: GLLineCaps): Promise<void>;

    /**
     * @brief Resize the line renderer.
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

    /**
    * Draws the lines from points.
    * @param points - the points that make a line. Must be at least 2 points.
    * @param width - width of a line. By default 10.
    * @param color - the color of a line. By default white.
    * @param join - the line join. Defines look of join between lines. By default {@link LineJoinType.ROUND}
    * @param caps - the line caps. Defines look of line ends. By default {@link LineCapsType.ROUND}
    */
    public abstract draw (points: Array<Vec2>, width?: number, color?: Color, join?: LineJoinType, caps?: LineCapsType): void

    /**
     * Draws the lines from points.
     * @param points - the points that make a line. Must be at least 2 points.
     * @param width - width of a line. By default 10.
     * @param stroke_width - width of a stroke. By default 5.
     * @param color - the color of a line. By default white.
     * @param stroke_color - the color of a stroke. By default black.
     * @param join - the line join. Defines look of join between lines. By default {@link LineJoinType.ROUND}
     * @param caps - the line caps. Defines look of line ends. By default {@link LineCapsType.ROUND}
     */
    public abstract drawWithStroke (points: Array<Vec2>,
        width?: number, stroke_width?: number,
        color?: Color, stroke_color?: Color,
        join?: LineJoinType,
        caps?: LineCapsType): void

    /**
   * Draws the lines from points.
   * @param start - the start point of a line.
   * @param end - the end point of a line.
   * @param width - width of a line. By default 10.
   * @param color - the color of a line. By default white.
   * @param join - the line join. Defines look of join between lines. By default {@link LineJoinType.ROUND}
   * @param caps - the line caps. Defines look of line ends. By default {@link LineCapsType.ROUND}
   */
    public abstract drawSingle (start: Vec2, end: Vec2, width?: number, color?: Color, caps?: LineCapsType): void
}