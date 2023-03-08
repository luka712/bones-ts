import { Color, Vec2 } from "../framework/bones_math";
import { IRenderer } from "../framework/bones_renderer";
import { TextureManager } from "../framework/bones_texture";
import { FreeCamera } from "../framework/camera/FreeCamera";
import { Framework } from "../framework/Framework";
import { FrameworkContext } from "../framework/FrameworkContext";
import { Camera2D } from "../framework/renderers/common/Camera2D";
import { SpriteRenderer } from "../framework/SpriteRenderer";
import { WebGPUBasicMaterialRenderPipelineWrapper } from "./material/basic/WebGPUBasicMaterialRenderPipelineWrapper";
import { WebGPUMesh } from "../framework/mesh/gpu/WebGPUMesh";
import { WebGPUModel } from "./model/WebGPUModel";

// TODO: see https://austin-eng.com/webgpu-samples/samples/helloTriangle#main.ts

// HOW RENDER WORK LOOPS FOR WEBGPU

// needs shader and geometry buffer 
// shader.use(pass_encoder) use shader
// buffer.bind(passe_encoder) bind geometry buffer ( this is for attributes )
// shader.useCamera() bind non instance uniforms ( for example view project matrix etc... )
// shader.bind(0) bind instance uniforms ( for example transform matrix)  0 for first entry
// shader.useTransform()
// buffer.draw()
// shader.bind(1)
// shader.useTransform()
// shader.draw() etc....

/**
 * Provides data from renderer.
 */
export class WebGPURendererContext 
{
    device: GPUDevice;
    /**
     * The render pass encoder in current frame.
     */
    currentRenderPassEncoder: GPURenderPassEncoder
}

/**
 * The WebGPU renderer.
 */
export class WebGPURenderer implements IRenderer
{
    public readonly context: WebGPURendererContext = new WebGPURendererContext();

    public clearColor: Color;
    private m_bufferSize: Vec2;

    /**
     * The WebGPU rendering context.
     */
    public m_gpuContext: GPUCanvasContext;

    /**
     * The GPU device.
     */
    public device: GPUDevice;

    /**
     * The current command encoder for rendering related operations.
     * {@link GPUCommandEncoder}
     */
    public drawCommandEncoder: GPUCommandEncoder;

    /**
     * The command encoder for update read/write buffers related operations.
     * {@link GPUCommandBuffer}
     */
    public updateCommandEncoder: GPUCommandEncoder;

    /**
     * The current pass encode.
     * {@link GPURenderPassEncoder}
     */
    public currentRenderPassEncoder: GPURenderPassEncoder;

    /**
     * The view of a color texture.
     */
    private m_colorTextureView: GPUTextureView;

    /**
     * The view of a depth texture.
     */
    private m_depthTextureView: GPUTextureView;

    // TODO: temp.
    public spriteRenderer: SpriteRenderer;
    public textureManager: TextureManager;

    /**
     * Gets the buffer width.
     */
    public get bufferWidth (): number
    {
        return this.m_bufferSize[0];
    }

    /**
     * Gets the buffer height.
     */
    public get bufferHeight (): number
    {
        return this.m_bufferSize[1];
    }

    /**
     * Get the buffer size.
     */
    public get bufferSize (): Vec2
    {
        return this.m_bufferSize;
    }

    /**
     * Construct new WebGL2 renderer.
     * @param canvas - an html canvas elemen to create WebGL context for.
     */
    constructor(private readonly m_canvas: HTMLCanvasElement, private readonly framework: Framework)
    {
        // @see https://medium.com/@carmencincotti/drawing-a-triangle-with-webgpu-53d48fb1ba8

        if (!navigator.gpu)
        {
            throw new Error("WebGPURenderer::constructor: WebGPU cannot be initialized. Window.navigator.gpu not found.");
        }


        this.m_bufferSize = new Vec2(m_canvas.width, m_canvas.height);
        this.clearColor = Color.lightPink();

        this.framework.window.subscribeToWindowResized((event) => 
        {
            this.m_bufferSize[0] = event.width;
            this.m_bufferSize[1] = event.height;
        });

        window.addEventListener("resize", () => 
        {
            this.resize();
        });
    }

    /**
     * Resize canvas and framebuffer attachments.
     */
    private resize (): void
    {
        this.m_bufferSize[0] = this.m_canvas.width;
        this.m_bufferSize[1] = this.m_canvas.height;

        Camera2D.resize(this.m_canvas.width, this.m_canvas.height);

        // CANVAS CONTEXT
        if (!this.m_gpuContext)
        {
            this.m_gpuContext = this.m_canvas.getContext('webgpu');
            const format = navigator.gpu.getPreferredCanvasFormat();
            this.m_gpuContext.configure({
                device: this.device,
                alphaMode: "opaque",
                size: [this.m_canvas.width * window.devicePixelRatio, this.m_canvas.height * window.devicePixelRatio],
                // format: format,
                format: 'bgra8unorm',
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
            });
        }

        // DEPTH TEXTURE
        const depth_texture = this.device.createTexture({
            size: [this.m_bufferSize.x, this.m_bufferSize.y, 1],
            format: 'depth24plus-stencil8',
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
        this.m_depthTextureView = depth_texture.createView();
    }


    /**
     * Initialize the WebGPU renderer.
     */
    public async initialize (): Promise<void>
    {
        const adapter = await navigator.gpu.requestAdapter({
            powerPreference: 'low-power'
        });

        if (!adapter)
        {
            throw new Error("WebGPURenderer::initialize: WebGPU cannot be initialized. Adapter not found.");
        }

        this.context.device = await adapter.requestDevice();
        this.device = this.context.device;
        FrameworkContext.device = this.device;


        this.device.lost.then(() => 
        {
            throw new Error("WebGPURenderer::initialize: WebGPU cannot be initialized. Device has been lost.");
        });

        // now call resize
        // create context and depth texture/depth texture view
        this.resize();

        // END INIT
    }

    /**
     * Prepares the WebGPU for drawing.
     */
    public beginDraw (): void
    {
        // ⏭ Acquire next image from context
        this.m_colorTextureView = this.m_gpuContext.getCurrentTexture().createView();

        // how to clear color
        const color_attachment: GPURenderPassColorAttachment = {
            view: this.m_colorTextureView,
            clearValue: this.clearColor,
            loadOp: 'clear',
            storeOp: 'store'
        };

        // how to clear depth buffer.
        const depth_attachment: GPURenderPassDepthStencilAttachment = {
            view: this.m_depthTextureView,
            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
            stencilClearValue: 0,
            stencilLoadOp: 'clear',
            stencilStoreOp: 'store',
        };


        const render_pass_desc: GPURenderPassDescriptor = {
            colorAttachments: [color_attachment],
            depthStencilAttachment: depth_attachment,
        };

        this.drawCommandEncoder = this.device.createCommandEncoder();
        this.updateCommandEncoder = this.device.createCommandEncoder();

        // TODO: 
        // read: https://toji.github.io/webgpu-gltf-case-study/

        // 🖌️ Encode drawing commands
        const render_pass_encoder = this.drawCommandEncoder.beginRenderPass(render_pass_desc);
        render_pass_encoder.setViewport(0, 0, this.m_bufferSize[0], this.m_bufferSize[1], 0, 1);
        render_pass_encoder.setScissorRect(0, 0, this.m_bufferSize[0], this.m_bufferSize[1]);
        this.context.currentRenderPassEncoder = render_pass_encoder;
        this.currentRenderPassEncoder = render_pass_encoder;
    }

    public endDraw (): void
    {
        this.currentRenderPassEncoder.end();

        this.device.queue.submit([
            this.updateCommandEncoder.finish(),
            this.drawCommandEncoder.finish()
        ]);
    }
    public destroy (): void
    {
    }

}