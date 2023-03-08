import { Color, Vec2 } from "../framework/bones_math";
import { IRenderer } from "../framework/bones_renderer";
import { Framework } from "../framework/Framework";
import { FrameworkContext } from "../framework/FrameworkContext";
import { Camera2D } from "../framework/renderers/common/Camera2D";
import { SpriteRenderer } from "../framework/SpriteRenderer";
import { WindowManager } from "../framework/Window";

/**
 * The WebGL 2 renderer.
 */
export class GL2Renderer implements IRenderer
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
        FrameworkContext.gl = this.gl;
        this.m_bufferSize = new Vec2(canvas.width, canvas.height);
        this.clearColor = Color.lightPink();

        this.m_window.subscribeToWindowResized((event) => 
        {
            this.m_bufferSize[0] = event.width;
            this.m_bufferSize[1] = event.height;
            Camera2D.resize(event.width, event.height);
        });
        Camera2D.resize(m_window.width, m_window.height);
    }

    public async initialize(): Promise<void>
    {
        // do nothing.
    }
    
    public beginDraw(): void
    {
        const gl = this.gl;

        // set up rendering viewport resolution
        this.gl.viewport(0, 0, this.m_bufferSize[0], this.m_bufferSize[1]);
        this.gl.clearColor(this.clearColor.r, this.clearColor.g, this.clearColor.b, this.clearColor.a);

        // clear color buffer and depth buffer.
        gl.enable(gl.DEPTH_TEST);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    public endDraw(): void
    {
    }

    public destroy(): void
    {
    }

}

