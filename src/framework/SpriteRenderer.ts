import { LifecycleState } from './bones_common'
import { Color, Vec2 } from './bones_math';
import { Texture2D } from './bones_texture';
import { Mat4x4 } from './math/mat/Mat4x4';
import { Rect } from './math/Rect';
import { SpriteFont } from './fonts/SpriteFont';

// RENDERING
// SHOULD BE DONE LIKE 
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
     * Alpha blending.
     */
    AlphaBlending,

    /**
     * Additive blending.
     */
    AdditiveBlending,

    /**
     * The multiplicative blending.
     * sr
     */
    MultiplicativeBlending,

    /**
     * The pre-multiplied alpha blending.
     */
    PreMultipliedAlphaBlending,

    /**
     * The interopolative blending.
     */
    InteropolativeBlending
}

/**
 * The sprite render manager, responsible for rendering of sprites.
 */
export abstract class SpriteRenderer 
{
    /**
     * Globally configurable draw origin. 
     * By default (0,0) for top left corner. 
     * (0.5, 0.5) will draw sprites from center.
     * (1.0, 1.0) will draw sprites from bottom right corner.
     * 
     * Be mindfull or {@link SpriteRenderer.rotationAnchor} as rotation might not be properly set on change of origin.
     * Also see and prefer using whenever possible
     * - {@link SpriteRenderer.setupCenteredOriginRotation}
     * - {@link SpriteRenderer.setupTopLeftOriginRotation}
     */
    public origin: Vec2 = Vec2.zero();

    /**
     * Globally configurable rotation anchor.
     * By default (0,0) for top left corner. 
     * (0.5, 0.5) will rotate sprites from center.
     * (1.0, 1.0) will rotate sprites from bottom right corner.
     *
     * Be mindfull or {@link SpriteRenderer.origin} as it affects rotation anchor.
     * Also see and prefer using whenever possible
     * - {@link SpriteRenderer.setupCenteredOriginRotation}
     * - {@link SpriteRenderer.setupTopLeftOriginRotation}
     */
    public rotationAnchor: Vec2 = Vec2.zero();

    /**
     * The life cycle state.
     */
    protected m_state: LifecycleState;

    /**
     * @brief The projection view matrix.
     */
    protected m_projectionViewMatrix: Mat4x4;


    /**
     * @brief Initialize the sprite batch manager. Initialize must be called in order to properly initialize all the variables.
     */
    public abstract initialize (): void;

    /**
     * @brief Destroy the sprite batch manager.
     */
    public abstract destroy (): void;

    /**
     * @brief Begins the sprite batch.
     * @param mode - the blending mode.
     * @param maxInstances - the max instances to draw. This affects buffer size for each sprite per texture.
     * Use large size if you expect large number of instances per texture. For example is long streams of texts are to be used.
     * If you do not expect large number of instances, such as when rendering small number of sprites or if you do not use sprite sheet, use small numbers.
     */
    public abstract begin (mode?: BlendMode, maxInstances?: number): void;

    /**
     * @brief Draws the texture at position.
     *
     * @param texture - which texture to draw.
     * @param draw_rect - the drawing rectangle
     * @param tint_color - the color to be used as tint color. 
     * @param rotation_in_radians - how much to rotate, in radians.
     * @param rotation_anchor - rotation origin of sprite, by default 0,0 for top left corner. 
     * 
     * @remarks 
     * rotation_anchor - passing 1 for x will create origin in right corner, passing 1 for y will create origin in bottom corner.
     */
    public abstract draw (texture: Texture2D, draw_rect: Rect, tint_color?: Color, rotation_in_radians?: number, rotation_anchor?: Vec2): void;

    /**
     * Draw the texture part specifed by source rectangle at specified draw rectangle, with optional tint color and rotation values.
     * To be used when part of texture needs to be drawn.
     * @param texture - which texture to draw.
     * @param drawRect - the drawing rectangle
     * @param sourceRect - defines which part from texture to select.
     * @param tintColor - the color to be used as tint color. 
     * @param rotationInRadians - how much to rotate, in radians.
     * @param rotation_anchor - rotation origin of sprite, by default 0,0 for top left corner. 
     */
    public abstract drawSource (texture: Texture2D, drawRect: Rect, sourceRect: Rect, tintColor?: Color, rotationInRadians?: number, rotationAnchor?: Vec2): void;

    /**
     * Draw the texture on given position.
     * @param texture - the texture to draw. 
     * @param position - the position to draw to.
     * @param tint_color - the tint color.
     * @param rotation_in_radians - rotation in radians.
     * @param rotation_anchor - rotation origin of sprite, by default 0,0 for top left corner. 
     * @param scale - the scale of a sprite. By default 1,1 for scaling.
     */
    public abstract drawOnPosition (texture: Texture2D, position: Vec2, tint_color?: Color, rotation_in_radians?: number, rotation_anchor?: Vec2, scale_factor? : Vec2): void;

    /**
     * Draw a string.
     */
    public abstract drawString (font: SpriteFont, text: string, position: Vec2, tintColor?: Color, scale?: number): void;

    /**
     * @brief End the sprite rendering.
     */
    public abstract end (): void

    /**
     * Sets {@link SpriteRenderer.origin} to (0.5, 0.5) and {@link SpriteRenderer.rotationAnchor} to (0,0) 
     * so that sprite origin is at center and sprite is rotated around center point.
     * 
     * Hint:
     * Use if you want to have sprites coordinates in center of sprite and rotate around center. 
     */
    public setupCenteredOriginRotation (): void 
    {
        this.origin.x = 0.5;
        this.origin.y = 0.5;
        this.rotationAnchor.x = 0.5;
        this.rotationAnchor.y = 0.5;
    }

    /**
     * Sets {@link SpriteRenderer.origin} to (0, 0) and {@link SpriteRenderer.rotationAnchor} to (0,0) 
     * so that sprite origin is at top left corner and sprite is rotated around top left point point.
     * 
     * Hint:
     * Use if you want to have sprites coordinates in top left cornern of sprite and rotate around that corner. 
     */
    public setupTopLeftOriginRotation (): void 
    {
        this.origin.x = 0;
        this.origin.y = 0;
        this.rotationAnchor.x = 0;
        this.rotationAnchor.y = 0;
    }
}
