import { Color, Vec2 } from "../framework/bones_math";
import { IRenderer } from "../framework/bones_renderer";
import { TextureManager } from "../framework/bones_texture";
import { Framework } from "../framework/Framework";
import { FrameworkContext } from "../framework/FrameworkContext";
import { Camera2D } from "../framework/renderers/common/Camera2D";
import { WebGPUCameraBuffer } from "../framework/renderers/common/gpu/WebGPUCameraBuffer";
import { WebGPUSpriteRenderer } from "../framework/renderers/sprite/gpu/WebGPUSpriteRenderer";
import { SpriteRenderer } from "../framework/SpriteRenderer";
import { WebGPUSpritePipeline } from "./pipelines/WebGPUSpritePipeline";

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
export class WebGPURendererContext {
    // #region Properties (3)

    private m_onRenderEndEvents: Array<(() => void)> = [];

    /**
       * The render pass encoder in current frame.
       */
    public currentRenderPassEncoder: GPURenderPassEncoder;
    public device: GPUDevice;

    // #endregion Properties (3)

    // #region Public Methods (2)

    /**
       * Invoked when renderer ends.
       */
    public invokeDrawEnd () {
        for (let cb of this.m_onRenderEndEvents) {
            cb();
        }
    }

    /**
       * Subscribe to renderer draw end.
       * @param cb 
       */
    public onDrawEnd (cb: () => void) {
        this.m_onRenderEndEvents.push(cb);
    }

    // #endregion Public Methods (2)
}

/**
 * The WebGPU renderer.
 */
export class WebGPURenderer implements IRenderer {
    // #region Properties (12)

    private m_bufferSize: Vec2;

    /**
       * The view of a depth texture.
       */
    private m_depthTexture: GPUTexture;

    public readonly context: WebGPURendererContext = new WebGPURendererContext();

    public clearColor: Color;
    /**
       * The current pass encode.
       * {@link GPURenderPassEncoder}
       */
    public currentRenderPassEncoder: GPURenderPassEncoder;
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
       * The WebGPU rendering context.
       */
    public m_gpuContext: GPUCanvasContext;
    // TODO: temp.
    public spriteRenderer: WebGPUSpriteRenderer;
    public textureManager: TextureManager;
    /**
       * The command encoder for update read/write buffers related operations.
       * {@link GPUCommandBuffer}
       */
    public updateCommandEncoder: GPUCommandEncoder;

    // #endregion Properties (12)

    // #region Constructors (1)

    /**
       * Construct new WebGL2 renderer.
       * @param canvas - an html canvas elemen to create WebGL context for.
       */
    constructor(private readonly m_canvas: HTMLCanvasElement, private readonly framework: Framework) {
        // @see https://medium.com/@carmencincotti/drawing-a-triangle-with-webgpu-53d48fb1ba8

        if (!navigator.gpu) {
            throw new Error("WebGPURenderer::constructor: WebGPU cannot be initialized. Window.navigator.gpu not found.");
        }

        this.m_bufferSize = new Vec2(m_canvas.width, m_canvas.height);
        this.clearColor = Color.lightPink();

        this.framework.window.subscribeToWindowResized((event) => {
            this.m_bufferSize[0] = event.width;
            this.m_bufferSize[1] = event.height;
        });

        window.addEventListener("resize", () => {
            this.resize();
        });
    }

    // #endregion Constructors (1)

    // #region Public Accessors (3)

    /**
       * Gets the buffer height.
       */
    public get bufferHeight (): number {
        return this.m_bufferSize[1];
    }

    /**
       * Get the buffer size.
       */
    public get bufferSize (): Vec2 {
        return this.m_bufferSize;
    }

    /**
       * Gets the buffer width.
       */
    public get bufferWidth (): number {
        return this.m_bufferSize[0];
    }

    // #endregion Public Accessors (3)

    // #region Public Methods (4)

    /**
       * Prepares the WebGPU for drawing.
       */
    public beginDraw (): void {
        // ⏭ Acquire next image from context
        const textureView = this.m_gpuContext.getCurrentTexture().createView();

        // how to clear color
        const colorAttachment: GPURenderPassColorAttachment = {
            view: textureView,
            clearValue: this.clearColor,
            loadOp: 'clear',
            storeOp: 'store'
        };

        // how to clear depth buffer.
        const depth_attachment: GPURenderPassDepthStencilAttachment = {
            view: this.m_depthTexture.createView(),
            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
            stencilClearValue: 0,
            stencilLoadOp: 'clear',
            stencilStoreOp: 'store',
        };

        const render_pass_desc: GPURenderPassDescriptor = {
            colorAttachments: [colorAttachment],
            depthStencilAttachment: depth_attachment,
        };

        this.drawCommandEncoder = this.device.createCommandEncoder();
        this.updateCommandEncoder = this.device.createCommandEncoder();

        // TODO: 
        // read: https://toji.github.io/webgpu-gltf-case-study/

        // 🖌️ Encode drawing commands
        this.currentRenderPassEncoder = this.drawCommandEncoder.beginRenderPass(render_pass_desc);
        this.currentRenderPassEncoder.setViewport(0, 0, this.m_bufferSize[0], this.m_bufferSize[1], 0, 1);
        this.currentRenderPassEncoder.setScissorRect(0, 0, this.m_bufferSize[0], this.m_bufferSize[1]);
        this.context.currentRenderPassEncoder = this.currentRenderPassEncoder;

        // write to camera buffer
        WebGPUCameraBuffer.writeTo2DCameraBuffer(this.device, Camera2D.projectionViewMatrix);

        this.spriteRenderer.beginFrame();
    }

    public destroy (): void {
    }

    public endDraw (): void {

        this.spriteRenderer.endFrame();

        this.currentRenderPassEncoder.end();

        this.device.queue.submit([
            this.updateCommandEncoder.finish(),
            this.drawCommandEncoder.finish()
        ]);

        this.context.invokeDrawEnd();
    }

    /**
       * Initialize the WebGPU renderer.
       */
    public async initialize (): Promise<void> {
        const adapter = await navigator.gpu.requestAdapter({
            powerPreference: "high-performance"
        });

        if (!adapter) {
            throw new Error("WebGPURenderer::initialize: WebGPU cannot be initialized. Adapter not found.");
        }

        this.context.device = await adapter.requestDevice();
        this.device = this.context.device;
        FrameworkContext.device = this.device;

        this.device.lost.then(() => {
            throw new Error("WebGPURenderer::initialize: WebGPU cannot be initialized. Device has been lost.");
        });

        // now call resize
        // create context and depth texture/depth texture view
        this.resize();

        // END INIT
    }

    // #endregion Public Methods (4)

    // #region Private Methods (1)

    /**
       * Resize canvas and framebuffer attachments.
       */
    private resize (): void {
        this.m_bufferSize[0] = this.m_canvas.width;
        this.m_bufferSize[1] = this.m_canvas.height;

        Camera2D.resize(this.m_canvas.width, this.m_canvas.height);

        // CANVAS CONTEXT
        if (!this.m_gpuContext) {
            this.m_gpuContext = this.m_canvas.getContext('webgpu');
            const format = navigator.gpu.getPreferredCanvasFormat();
            this.m_gpuContext.configure({
                device: this.device,
                alphaMode: "opaque",
                // size: [this.m_canvas.width * window.devicePixelRatio, this.m_canvas.height * window.devicePixelRatio],
                // format: format,
                format: 'bgra8unorm',
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
            });
        }

        // DEPTH TEXTURE
        this.m_depthTexture = this.device.createTexture({
            size: [this.m_bufferSize.x, this.m_bufferSize.y, 1],
            format: 'depth24plus-stencil8',
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
    }

    // #endregion Private Methods (1)
}