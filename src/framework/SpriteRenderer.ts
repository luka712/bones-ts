import { LifecycleState } from './bones_common'
import { GeometryBuffer } from './GeometryBuffer';
import { Color, Vec2 } from './bones_math';
import { Texture2D } from './bones_texture';
import { Mat4x4 } from './math/mat/Mat4x4';
import { Rect } from './math/Rect';
import { Vec3 } from './math/vec/Vec3';
import { SpriteShader } from './shaders/SpriteShader';
import { SpriteFont } from './fonts/SpriteFont';

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
 * Pixels can be drawn using a function that blends the incoming (source) RGBA values with the RGBA values that are already in the frame buffer (the destination values)
 * For webl documentation see [OpenGL](https://registry.khronos.org/OpenGL-Refpages/es2.0/xhtml/glBlendFunc.xml)
 */
export class Blend 
{
    constructor(src_factor: BlendFactor = BlendFactor.SRC_ALPHA, dest_factor: BlendFactor = BlendFactor.ONE_MINUS_SRC_ALPHA)
    {
        this.srcFactor = src_factor;
        this.destFactor = dest_factor;
    }

    /**
     * Specifies how the red, green, blue, and alpha source blending factors are computed. 
     */
    srcFactor: BlendFactor

    /**
     * Specifies how the red, green, blue, and alpha destination blending factors are computed.
     */
    destFactor:  BlendFactor;

    /**
     * A built-in state object with settings for blending with non-premultipled alpha, that is blending source and destination data using alpha while assuming the color data contains no alpha information.
     */
    public static nonPremultiplied(): Blend 
    {
        return new Blend(BlendFactor.SRC_ALPHA, BlendFactor.ONE_MINUS_SRC_ALPHA);
    }

    /**
     * A built-in state object with settings for additive blend, which is adding the destination data to the source data without using alpha.
     */
    public static additive(): Blend 
    {
        return new Blend(BlendFactor.SRC_ALPHA, BlendFactor.ONE);
    }
}

/**
 * The blend factor.
 */
export enum BlendFactor 
{
    SRC_ALPHA,
    ONE_MINUS_SRC_ALPHA,
    ONE 
}

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
     * @brief Set the blend for sprite batch.
     *
     * @param mode
     */
    protected abstract setBlendingMode (mode: Blend): void;

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
    public abstract begin (mode?: Blend): void;

    /**
     * @brief Draws the texture at position.
     *
     * @param texture - which texture to draw.
     * @param draw_rect - the drawing rectangle
     * @param tint_color - the color to be used as tint color. 
     * @param axis_of_rotation - if sprites needs to be rotated around arbitrary axis.
     * @param rotation_in_radians - how much to rotate, in radians.
     * @param origin - origin of sprite, by default 0,0 for top left corner. 
     * 
     * @remarks 
     * origin - passing 1 for x will create origin in right corner, passing 1 for y will create origin in bottom cornern.
     */
    public abstract draw (texture: Texture2D, draw_rect: Rect, tint_color?: Color, axis_of_rotation?: Vec3, rotation_in_radians?: number, origin? : Vec2): void;

    /**
     * Draw the texture part specifed by source rectangle at specified draw rectangle, with optional tint color and rotation values.
     * To be used when part of texture needs to be drawn.
     * @param { Texture2D } texture - which texture to draw.
     * @param { Rect } draw_rect - the drawing rectangle
     * @param { Rect } source_rect - defines which part from texture to select.
     * @param { Vec2|undefined } tint_color - the color to be used as tint color. 
     * @param { Vec3|undefined } axis_of_rotation - if sprites needs to be rotated around arbitrary axis.
     * @param { number|undefined} rotation_in_radians - how much to rotate, in radians.
     * TODO: origin
     */
    public abstract drawSource(texture: Texture2D, draw_rect: Rect, source_rect: Rect, tint_color?: Color, axis_of_rotation?: Vec3, rotation_in_radians?: number) : void;

    /**
     * Draw the texture on given position.
     * @param texture - the texture to draw. 
     * @param position - the position to draw to.
     * @param tint_color - the tint color.
     * @param rotation_in_radians - rotation in radians.
     * @param origin - origin of sprite, by default 0,0 for top left corner. 
     */
    public abstract drawOnPosition(texture: Texture2D, position: Vec2, tint_color?: Color, rotation_in_radians?: number, origin?: Vec2) : void;

        /**
     * Draw a string.
     * @param { SpriteFont } font 
     * @param { string } text 
     * @param { Vec2 } position 
     * @param { number | null | never } scale - by default set to 1. This means that font is renderer in it's natural size.
     * @param { Color | null | never } color - by default white.
     */
    public drawString (font: SpriteFont, text: string, position: Vec2, scale?: number, color?: Color): void {
        // TODO: temporary, move later to webgl renderer
        throw new Error("Not implemented");
    }

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