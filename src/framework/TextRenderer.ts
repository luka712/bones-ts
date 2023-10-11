import { GeometryBuffer } from "./GeometryBuffer";
import { Color, Mat4x4, Vec2 } from "./bones_math";
import { IRenderer } from "./bones_renderer";
import { BlendMode } from "./sprite/SpriteRenderer";
import { Texture2D } from "./bones_texture";
import { Vec3 } from "./math/vec/Vec3";
import { SpriteFont } from "./fonts/SpriteFont";
import { TextShader } from "./shaders/TextShader";

/**
   * @brief The abstract text render manager class.
   * 
   */
abstract class TextRenderer
{
    /**
     * Get the renderer.
     */
     public readonly renderer: IRenderer;

    /**
     * @brief Shader used for text.
     */
    protected m_shader: TextShader;


    /**
     * @brief The projection matrix.
     */
    protected m_projectionMatrix: Mat4x4;

    /**
     * @brief The view matrix.
     */
    protected m_viewMatrix: Mat4x4;

    /**
     * @brief The width of a renderer. Usually this is referring to graphics renderer, such as OpenGL but can be set differently.
     */
    protected m_width: number;

    /**
     * @brief The height of a renderer. Usually this is referring to graphics renderer, such as OpenGL but can be set differently.
     */
    protected m_height: number;



    /**
     * @brief Set the Blending Mode for sprite batch.
     *
     * @param { BlendMode } mode
     */
    protected abstract setBlendingMode(mode: BlendMode): void;

    /**
     * @brief Initialize the text render manager. Initialize must be called in order to properly initialize all the variables.
     * @returns {  Promise<void> }
     */
    public abstract initialize(): Promise<void>;

    /**
     * @brief Destroy the text render manager.
     * @returns { void }
     */
    public abstract destroy(): void;

    /**
     * Pass arbitrary data to sprite renderer if needed.
     * @param { T | unknown } data - any data required. This is called once per frame, right at the beginning of frame.
     */
     public abstract beginRenderPass<T>(data?: T) : void;

    /**
     * @brief Begins the sprite batch.
     * @param { BlendMode | null | never }
     * @returns { void }
     */
    public abstract begin(mode?: BlendMode): void;
    
    /**
     * Draw a string.
     * @param { SpriteFont } font 
     * @param { string } text 
     * @param { Vec2 } position 
     * @param { number | null | never } scale - by default set to 1. This means that font is renderer in it's natural size.
     * @param { Color | null | never } color - by default white.
     */
    public abstract drawString(font: SpriteFont, text: string, position: Vec2, scale?: number, color?: Color): void;

    /**
     * @brief Ends the rendering.
     * @returns { void }
     */
    public abstract end(): void;

    /**
	 * @brief Resize the text renderer.
	 * CAUTION: Ideally this should be set to renderer width and height, but can be done otherwise.
	 * Not setting it to renderer width and height might lead to some undesired behaviour.
	 *
	 * @param { number } width - new width.
	 * @param { number } height - new height.
	 * @returns { void }
	 */
    public resize(width: number, height: number): void
    {
        this.m_width = width;
        this.m_height = height;
        this.m_projectionMatrix = Mat4x4.orthographic(0, width, height, 0, -1, 1) as Mat4x4;
        this.m_viewMatrix =Mat4x4.lookAt(Vec3.zero(), Vec3.negativeUnitZ(), Vec3.unitY()) as Mat4x4;
    }

};

export 
{
    TextRenderer as TextRenderManager
}