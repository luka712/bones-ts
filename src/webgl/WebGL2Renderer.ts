import { Color, Vec2 } from "../framework/bones_math";
import { IRenderer } from "../framework/bones_renderer";
import { SpriteRenderer } from "../framework/SpriteRenderer";
import { WindowManager } from "../framework/Window";

/**
 * The WebGL 2 renderer.
 */
export class WebGL2Renderer implements IRenderer
{

    public clearColor: Color;
    private m_bufferSize: Vec2;

    /**
     * The WebGL rendering context.
     */
    public readonly gl: WebGL2RenderingContext;

    /**
     * Gets the buffer width.
     */
    public get bufferWidth(): number
    {
        return this.m_bufferSize[0];
    }

    /**
     * Gets the buffer height.
     */
    public get bufferHeight(): number
    {
        return this.m_bufferSize[1];
    }

    /**
     * Get the buffer size.
     */
    public get bufferSize(): Vec2
    {
        return this.m_bufferSize;
    }

    public spriteRenderer: SpriteRenderer;

    /**
     * Construct new WebGL2 renderer.
     * @param canvas - an html canvas elemen to create WebGL context for.
     */
    constructor(canvas: HTMLCanvasElement, private readonly m_window: WindowManager)
    {
        this.gl = canvas.getContext("webgl2");
        this.m_bufferSize = new Vec2(canvas.width, canvas.height);
        this.clearColor = Color.lightPink();

        this.m_window.subscribeToWindowResized((event) => 
        {
            this.m_bufferSize[0] = event.width;
            this.m_bufferSize[1] = event.height;
        });
    }

    public async initialize(): Promise<void>
    {
        // do nothing.
    }
    
    public beginDraw(): void
    {
        // set up rendering viewport resolution
        this.gl.viewport(0, 0, this.m_bufferSize[0], this.m_bufferSize[1]);
        this.gl.clearColor(this.clearColor.r, this.clearColor.g, this.clearColor.b, this.clearColor.a);


        // clear color buffer and depth buffer.
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.spriteRenderer.beginRenderPass();
    }

    public endDraw(): void
    {
    }

    public destroy(): void
    {
    }

}
