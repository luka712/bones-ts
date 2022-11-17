import { LifecycleState } from "../framework/bones_common";
import { IRenderFramebuffer } from "../framework/bones_framebuffer";
import { QuadGeometry } from "../framework/bones_geometry";
import { Color } from "../framework/bones_math";
import { IRenderer } from "../framework/bones_renderer";
import { VertexBufferDescription, ComponentType, IndicesBufferDescription, BufferUsage, DrawType } from "../framework/GeometryBuffer";
import { WindowManager, WindowResizeEvent } from "../framework/Window";
import {  GLGeometryBuffer } from "./GLGeometryBuffer";

/**
 * The WebGL render framebuffer.
 */
class GLRenderFrameBuffer implements IRenderFramebuffer 
{
    private __state: LifecycleState;

    private m_geometryBuffer: GLGeometryBuffer;

    private __texture: WebGLTexture;
    private __fbo: WebGLFramebuffer;
    private __rbo: WebGLRenderbuffer;

    constructor(window_manager: WindowManager, private __renderer: IRenderer, private __gl: WebGL2RenderingContext)
    {
        this.__state = LifecycleState.Created;

        window_manager.subscribeToWindowResized((args: WindowResizeEvent) => 
        {
            this.__gl.deleteTexture(this.__texture);
            this.__gl.deleteFramebuffer(this.__fbo);
            this.__gl.deleteRenderbuffer(this.__rbo);
            this.createFramebuffer(args.width, args.height);
        });

    }
    /**
     * @brief Initialize the geometry.
     */
    private initGeometry(): void 
    {
        const geometry = new QuadGeometry();

        const arrays: Array<VertexBufferDescription> = new Array();

        const position_attr = new VertexBufferDescription();
        for (let i = 0; i < 12; i++)
        {
         geometry.vertices[i] *= 2;
        }
        position_attr.data = geometry.vertices;
        position_attr.count = 12;
        position_attr.isPositionBuffer = true;
        position_attr.layoutLocation = 0;
        position_attr.vertexSize = 3;
        position_attr.componentType = ComponentType.FLOAT;

        const texture_coords_attr = new VertexBufferDescription();
        texture_coords_attr.data = geometry.textureCoords;
        texture_coords_attr.count = 8;
        texture_coords_attr.isPositionBuffer = true;
        texture_coords_attr.layoutLocation = 1;
        texture_coords_attr.vertexSize = 2;
        texture_coords_attr.componentType = ComponentType.FLOAT;

        arrays.push(position_attr);
        arrays.push(texture_coords_attr);

        const indices = new IndicesBufferDescription();
        indices.data = geometry.indices;
        indices.count = 6;
        indices.componentType = ComponentType.UNSIGNED_SHORT;
        indices.drawType = DrawType.TRIANGLES;

        this.m_geometryBuffer = new GLGeometryBuffer(this.__gl, arrays, indices);
    }

    /**
     * @brief Create a Framebuffer object and texture related to it.
     * @param { number } width
     * @param { number } height
     */
    private createFramebuffer(width: number, height: number): void 
    {
        // https://learnopengl.com/Advanced-OpenGL/Framebuffers

        // create framebuffer and it's texture.
        this.__fbo = this.__gl.createFramebuffer();
        this.__texture = this.__gl.createTexture();

        this.bind();

        this.__gl.bindTexture(this.__gl.TEXTURE_2D, this.__texture);
        this.__gl.texImage2D(this.__gl.TEXTURE_2D, 0, this.__gl.RGBA, width, height, 0, this.__gl.RGBA, this.__gl.UNSIGNED_BYTE, null);
        this.__gl.texParameteri(this.__gl.TEXTURE_2D, this.__gl.TEXTURE_MIN_FILTER, this.__gl.LINEAR);
        this.__gl.texParameteri(this.__gl.TEXTURE_2D, this.__gl.TEXTURE_MAG_FILTER, this.__gl.LINEAR);
        this.__gl.bindTexture(this.__gl.TEXTURE_2D, null);

        // attach texture to framebuffer.
        this.__gl.framebufferTexture2D(this.__gl.FRAMEBUFFER, this.__gl.COLOR_ATTACHMENT0, this.__gl.TEXTURE_2D, this.__texture, 0);

        this.__rbo = this.__gl.createRenderbuffer();
        this.__gl.bindRenderbuffer(this.__gl.RENDERBUFFER, this.__rbo);
        this.__gl.renderbufferStorage(this.__gl.RENDERBUFFER, this.__gl.DEPTH24_STENCIL8, width, height);
        this.__gl.bindRenderbuffer(this.__gl.RENDERBUFFER, null);

        if (this.__gl.checkFramebufferStatus(this.__gl.FRAMEBUFFER) != this.__gl.FRAMEBUFFER_COMPLETE)
        {
            console.error("ERROR::FRAMEBUFFER::Framebuffer is not complete!");
        }

        this.unbind();
    }

    /**
     * @brief Initialize the frame buffer.
     */
    public initialize(): void 
    {
        if (this.__state == LifecycleState.Initialized)
        {
            return;
        }

        this.__state = LifecycleState.Initialized;

        this.createFramebuffer(this.__renderer.bufferWidth, this.__renderer.bufferHeight);
        this.initGeometry();
    }


    /**
     * @brief Bind the framebuffer.
     */
    public bind(): void 
    {
        this.__gl.bindFramebuffer(this.__gl.FRAMEBUFFER, this.__fbo);
    }

    /**
     * @brief Unbind the framebuffer.
     */
    public unbind(): void
    {
        this.__gl.bindFramebuffer(this.__gl.FRAMEBUFFER, null);

    }

    /**
     * @brief Clear the framebuffer before it is being used to draw.
     * @param { Color } color - color to clear to
     * @returns { void }
     */
    public clear(color: Color): void
    {
        this.__gl.clearColor(color.r, color.g, color.b, color.a);
        this.__gl.clear(this.__gl.COLOR_BUFFER_BIT | this.__gl.DEPTH_BUFFER_BIT); // we're not using the stencil buffer now
        this.__gl.enable(this.__gl.DEPTH_TEST);
    }

    /**
     * @brief Draw the pass.
     */
    public drawPass(): void
    {
        // second pass
        this.__gl.bindFramebuffer(this.__gl.FRAMEBUFFER, null); // back to default
        this.__gl.clearColor(0, 0, 0, 1.0);
        this.__gl.clear(this.__gl.COLOR_BUFFER_BIT);

        this.m_geometryBuffer.bind();
        this.__gl.disable(this.__gl.DEPTH_TEST);
        // reset the currently bound texture to texture unit 0.
        this.__gl.activeTexture(this.__gl.TEXTURE0);
        this.__gl.bindTexture(this.__gl.TEXTURE_2D, this.__texture);
        this.m_geometryBuffer.draw();

    }

    /**
     * @brief Delete the framebuffer and release the resources.
     */
    public delete(): void
    {
        if (this.__state != LifecycleState.Destroyed)
        {
            // CAUTION: effect is not removed here, it's responsibility of caller.
            this.m_geometryBuffer.delete();
            this.__gl.deleteTexture(this.__texture);
            this.__gl.deleteFramebuffer(this.__fbo);
            this.__gl.deleteRenderbuffer(this.__rbo);
        }
    }
}


export 
{
    GLRenderFrameBuffer
}