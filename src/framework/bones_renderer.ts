import { Color, Vec2 } from "./bones_math";
import { SpriteRenderer } from "./SpriteRenderer";

interface IRenderer
{
    /**
    * Gets the renderer buffer width.
    * TODO: deprecated, prefer bufferSize
    */
    readonly bufferWidth: number;

    /**
     * Gets the renderer buffer height.
     * TODO: deprecated, prefer bufferSize
     */
    readonly bufferHeight: number

    /**
     * The size of a buffer
     */
    readonly bufferSize: Vec2;

    /**
     * The clear color of renderer.
     */
    clearColor: Color;

    /**
     * The sprite renderer.
     */
    spriteRenderer: SpriteRenderer;

    /**
     * Initialize the renderer.
     */
    initialize (): Promise<void>;

    /**
     * Begin of draw method.
     */
    beginDraw (): void;

    /**
     * End of draw method.
     */
    endDraw (): void;

    /**
     *  Destroy the renderer.
     */
    destroy (): void;
}


export 
{
    IRenderer
}