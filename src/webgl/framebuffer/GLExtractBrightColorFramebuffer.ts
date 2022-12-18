import { Vec2 } from "../../framework/bones_math";
import { IRenderer } from "../../framework/bones_renderer";
import { Texture2D, TextureChannel } from "../../framework/bones_texture";
import { WindowManager } from "../../framework/Window";
import { GLTexture2D } from "../GLTexture";
import { GLRenderFrameBuffer } from "./GLRenderFrameBuffer"

// Create a framebuffer with two color attachments, in order to extract 
// outColor and outBrightColor from shader. Renders into those two attachments.


/**
 * The framebuffer which can be used to extract bright color.
 * [Bloom](https://learnopengl.com/Advanced-Lighting/Bloom)
 */
export class GLExtractBrightColorFramebuffer extends GLRenderFrameBuffer 
{
    /**
    * The constructor.
    * @param window_manager 
    * @param renderer 
    * @param gl 
    */
    constructor(window_manager: WindowManager, renderer: IRenderer, gl: WebGL2RenderingContext)
    {
        super(window_manager, renderer, gl)
    }

    /**
     * Gets the brightness texture.
     */
    public getBrightnessOutputTexture (): Texture2D 
    {
        // second one is brightness.
        return this.m_textures[1];
    }

    public initialize (): void
    {
        super.initialize();
    }

    /**
     * @inheritdoc
     */
    protected createFramebuffer (): void
    {
        const width = this.m_renderer.bufferWidth;
        const height = this.m_renderer.bufferHeight;
        const gl = this.m_gl;

        // create the framebuffer.
        this.m_fbo = gl.createFramebuffer();

        // bind framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.m_fbo);

        // create 2 texture (1 for normal rendering, other for brightness threshold values)
        this.m_textures = [];
        for (let i = 0; i < 2; i++)
        {
            const texture = GLTexture2D.createEmpty(gl, new Vec2(width, height)) as GLTexture2D;
            this.m_textures.push(texture);
            texture.bind();
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, texture.handle, 0);
        }

        // create and attach depth buffer (renderbuffer)
        const render_buffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, render_buffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH24_STENCIL8, width, height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, render_buffer);

        // tell OpenGL which color attachments we'll use (of this framebuffer) for rendering 
        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,
            gl.COLOR_ATTACHMENT1,
        ]);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE)
        {
            console.error("ERROR::GLBloomFramebuffer::Framebuffer m_hdrFbo is not complete!");
        }

        this.unbind();

    }

    /**
     * @inheritdoc
     */
    public bind (): void
    {
        const gl = this.m_gl;

        //  render scene into framebuffer.
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.m_fbo);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }


    /**
     * The draw pass.
     */
    public drawPass (): void
    {
        // draw pass is empty, as it shoud not do anything! 
        // we only need to collect the textures from pass.
    }
}