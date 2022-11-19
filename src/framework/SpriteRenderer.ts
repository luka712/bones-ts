import { LifecycleState } from './bones_common'
import { GeometryBuffer } from './GeometryBuffer';
import { Color } from './bones_math';
import { Texture2D } from './bones_texture';
import { Mat4x4 } from './math/mat/Mat4x4';
import { Rect } from './math/RectF';
import { Vec3 } from './math/vec/Vec3';
import { SpriteShader } from './shaders/SpriteShader';

// RENDERING
// SHOULD BE DONE LIKE 
// spriteRenderer.beginRenderPass() --- should be only called by 'renderer' itself. Main renderer
// .... whetever
// spriteRenderer.begin()
// spriteRenderer.draw()
// spriteRenderer.draw()
// ... as many instances as you want
// spriteRenderer.end()
// ... some other renderer or stuff
// if you want to draw sprites again
// spriteRenderer.begin()
// spriteRenderer.draw() .... n items
// spriteRenderer.end()


/**
 * BlendMode is used by various renderers, for example Text and Sprite renderers.
 */
export enum BlendMode
{
    /**
     * factor = 1 - normalized_alpha
     * Use this to achieve transparency, where alpha value of 1.0 ( 255 ) will result in 0, meaning fully transparent image.
     */
    OneMinusSrcAlpha
}

/**
 * The sprite render manager, responsible for rendering of sprites.
 */
export abstract class SpriteRenderer 
{
    /**
     * The life cycle state.
     */
    protected m_state: LifecycleState;

    /**
     * The shader used for sprites.
     */
    protected m_shader: SpriteShader;

    /**
     * @brief The projection matrix.
     */
    protected m_projectionMatrix: Mat4x4;

    /**
     * @brief The view matrix.
     */
    protected m_viewMatrix: Mat4x4;

    /**
     * @brief Set the Blending Mode for sprite batch.
     *
     * @param { BlendMode } mode
     * @returns { void }
     */
    protected abstract setBlendingMode (mode: BlendMode): void;

    /**
     * @brief Initialize the sprite batch manager. Initialize must be called in order to properly initialize all the variables.
     */
    public abstract initialize (): void;

    /**
     * @brief Destroy the sprite batch manager.
     */
    public abstract destroy (): void;

    /**
     * Pass arbitrary data to sprite renderer if needed.
     * @param { T | unknown } data - any data required. This is called once per frame, right at the beginning of frame.
     */
    public abstract beginRenderPass<T>(data?: T) : void;

    /**
     * @brief Begins the sprite batch.
     */
    public abstract begin (mode?: BlendMode): void;

    /**
     * @brief Draws the texture at position.
     *
     * @param { Texture2D } texture - which texture to draw.
     * @param { Rect } draw_rect - the drawing rectangle
     * @param { Vec2|undefined } tint_color - the color to be used as tint color. 
     * @param { Vec3|undefined } axis_of_rotation - if sprites needs to be rotated around arbitrary axis.
     * @param { number|undefined} rotation_in_radians - how much to rotate, in radians.
     */
    public abstract draw (texture: Texture2D, draw_rect: Rect, tint_color?: Color, axis_of_rotation?: Vec3, rotation_in_radians?: number): void;

    /**
     * Draw the texture part specifed by source rectangle at specified draw rectangle, with optional tint color and rotation values.
     * To be used when part of texture needs to be drawn.
     * @param { Texture2D } texture - which texture to draw.
     * @param { Rect } draw_rect - the drawing rectangle
     * @param { Rect } source_rect - defines which part from texture to select.
     * @param { Vec2|undefined } tint_color - the color to be used as tint color. 
     * @param { Vec3|undefined } axis_of_rotation - if sprites needs to be rotated around arbitrary axis.
     * @param { number|undefined} rotation_in_radians - how much to rotate, in radians.
     */
    public abstract drawSource(texture: Texture2D, draw_rect: Rect, source_rect: Rect, tint_color?: Color, axis_of_rotation?: Vec3, rotation_in_radians?: number) : void;

    /**
     * @brief End the sprite rendering.
     */
    public abstract end (): void

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