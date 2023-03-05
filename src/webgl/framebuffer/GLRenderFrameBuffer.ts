import { LifecycleState } from "../../framework/bones_common";
import { IRenderFramebuffer } from "../../framework/bones_framebuffer";
import { Color, Vec2 } from "../../framework/bones_math";
import { IRenderer } from "../../framework/bones_renderer";
import { Texture2D } from "../../framework/bones_texture";
import { WindowManager, WindowResizeEvent } from "../../framework/Window";
import { GLScreenQuadGeometry } from "../mesh/GLScreenQuadGeometry";
import { GLTexture2D } from "../GLTexture";


//---------------- PIPELINE ------// 
// - createAttributeBuffers
// - createFramebuffer
// - bindFramebuffer
// - createTextures
// - attachTexturesToFramebuffer
// - createAndAttachRenderBuffer
// - framebufferColorAttachments
// - checkFramebufferStatus
// - unbindFramebuffer

/**
 * The WebGL render framebuffer.
 */
export class GLRenderFrameBuffer implements IRenderFramebuffer 
{
    private m_state: LifecycleState;

    /**
     * The quad buffer with coords from -1 to 1 in order to cover entire screen.
     */
    protected m_buffer: GLScreenQuadGeometry;

    /**
     * Textures that are bound to framebuffer.
     */
    protected m_textures: Array<GLTexture2D>;

    // GL
    protected m_fbo: WebGLFramebuffer;


    protected m_rbo: WebGLRenderbuffer;

    /**
     * The constructor.
     * @param window_manager 
     * @param m_renderer 
     * @param m_gl 
     */
    constructor(window_manager: WindowManager, protected m_renderer: IRenderer, protected m_gl: WebGL2RenderingContext)
    {
        this.m_state = LifecycleState.Created;

        // NOTE:
        // be mindful, if buffers is created by using 'new', it needs to be destroyed!!!
        this.m_buffer = GLScreenQuadGeometry.instance;

        window_manager.subscribeToWindowResized((args: WindowResizeEvent) => 
        {
            this.delete();
            this.initialize()
        });

    }

    /**
     * @inheritdoc
     */
    public getOutputTexture (index: number = 0): Texture2D
    {
        return this.m_textures[index];
    }



    /**
     * Creates the framebuffer.
     */
    protected createFramebuffer (): void 
    {
        // https://learnopengl.com/Advanced-OpenGL/Framebuffers

        const width = this.m_renderer.bufferWidth;
        const height = this.m_renderer.bufferHeight;
        const gl = this.m_gl;


        this.m_fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.m_fbo);

        const tex = GLTexture2D.createEmpty(this.m_gl, new Vec2(width, height)) as GLTexture2D;

        // attach to frame buffer.
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex.handle, 0);

        const render_buffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, render_buffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH24_STENCIL8, width, height);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE)
        {
            console.error("ERROR::FRAMEBUFFER::Framebuffer is not complete!");
        }

        this.m_textures = [tex];

        this.unbind();
    }


    /**
     * Unbinds the framebuffer.
     */
    protected unbindFramebuffer (): void 
    {
        this.m_gl.bindFramebuffer(this.m_gl.FRAMEBUFFER, null);
    }


    /**
     * @brief Initialize the frame buffer.
     */
    public initialize (): void 
    {
        if (this.m_state == LifecycleState.Initialized)
        {
            return;
        }

        this.m_state = LifecycleState.Initialized;

        this.m_buffer.intialize();

        this.createFramebuffer();
        this.unbindFramebuffer();
    }


    /**
     * @brief Bind the framebuffer.
     */
    public bind (): void 
    {
        this.m_gl.bindFramebuffer(this.m_gl.FRAMEBUFFER, this.m_fbo);
    }

    /**
     * @brief Unbind the framebuffer.
     */
    public unbind (): void
    {
        this.m_gl.bindFramebuffer(this.m_gl.FRAMEBUFFER, null);
    }

    /**
     * @brief Clear the framebuffer before it is being used to draw.
     * @param { Color } color - color to clear to
     * @returns { void }
     */
    public clear (color: Color): void
    {
        this.m_gl.clearColor(color.r, color.g, color.b, color.a);
        this.m_gl.clear(this.m_gl.COLOR_BUFFER_BIT | this.m_gl.DEPTH_BUFFER_BIT); // we're not using the stencil buffer now
        this.m_gl.enable(this.m_gl.DEPTH_TEST);
    }

    /**
     * @brief Draw the pass.
     */
    public drawPass (): void
    {
        const gl = this.m_gl;

        // second pass
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); // back to default
        gl.clearColor(0, 0, 0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // bind the geometry.
        this.m_buffer.bind();
        gl.disable(gl.DEPTH_TEST);
        // reset the currently bound texture to texture unit 0.
        const tex = this.getOutputTexture(0); 
        tex.active(0);
        tex.bind(); 

        this.m_buffer.draw();
    }

    /**
     * @brief Delete the framebuffer and release the resources.
     */
    public delete (): void
    {
        if (this.m_state != LifecycleState.Destroyed)
        {
            const gl = this.m_gl;



            for (const tex of this.m_textures)
            {
                tex.destroy();
            }


            this.m_gl.deleteFramebuffer(this.m_fbo);
            this.m_gl.deleteRenderbuffer(this.m_fbo);
        }
    }
}

