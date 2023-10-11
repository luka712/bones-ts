import { Color, Vec2 } from "../bones_math";
import { Framework } from "../Framework";
import { Camera2D } from "../sprite/common/Camera2D";
import { Texture2D } from "../textures/Texture2D";

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
 * The WebGPU renderer.
 */
export class Renderer {
    // #region Properties (12)

    private m_bufferSize: Vec2;

    /**
       * The view of a depth texture.
       */
    private m_depthTexture: GPUTexture;

    public clearColor: Color;
    /**
      * @brief WGPURenderPassEncoder is a class in WebGPU. It is responsible for creating a render pass encoder.
      * Render pass encoder in this context is a collection of commands that can be executed.
      */
    private m_currentPassEncoder: GPURenderPassEncoder;

    /**
    * GPUCommandEncoder is a class in WebGPU. It is responsible for creating a command encoder.
    * Command encoder in this context is a collection of commands that can be executed.
    */
    private m_drawCommandEncoder: GPUCommandEncoder;

    /**
     * WGPUTextureView is a class in WebGPU. It is texture fetched on begining of frame to which we draw.
     * Texture view in this context is a texture that can be drawn on.
     */
    private m_currentTextureView?: GPUTextureView;

    /**
     * The destination texture.
     * This is the texture that will be rendered to.
     * If not set, it will render to canvas.
     */
    public destinationTexture?: Texture2D;

    /**
       * The GPU device.
       */
    public device: GPUDevice;

    /**
       * The WebGPU rendering context.
       */
    public m_gpuContext: GPUCanvasContext;

    /**
     * Gets the canvas texture, this can be used to draw to canvas.
     */
    public get canvasTexture (): GPUTexture {
        return this.m_gpuContext.getCurrentTexture();
    }

    // #endregion Properties (12)

    // #region Constructors (1)

    /**
       * Construct new WebGL2 renderer.
       * @param canvas - an html canvas elemen to create WebGL context for.
       */
    constructor(private readonly m_framework: Framework) {
        // @see https://medium.com/@carmencincotti/drawing-a-triangle-with-webgpu-53d48fb1ba8

        if (!navigator.gpu) {
            throw new Error("WebGPURenderer::constructor: WebGPU cannot be initialized. Window.navigator.gpu not found.");
        }


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

        this.m_drawCommandEncoder = this.device.createCommandEncoder();

        // if we have render texture, we will render to it, otherwise we will render to canvas
        if (this.destinationTexture) {
            this.m_currentTextureView = this.destinationTexture.texture.createView();
        }
        else {
            this.m_currentTextureView = this.canvasTexture.createView();
        }

        // how to clear depth buffer.
        // const depth_attachment: GPURenderPassDepthStencilAttachment = {
        //     view: this.m_depthTexture.createView(),
        //     depthClearValue: 1,
        //     depthLoadOp: 'clear',
        //     depthStoreOp: 'store',
        //     stencilClearValue: 0,
        //     stencilLoadOp: 'clear',
        //     stencilStoreOp: 'store',
        // };

        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [{
                view: this.m_currentTextureView,
                clearValue: this.clearColor,
                loadOp: 'clear',
                storeOp: 'store'
            }],
            // TOOD: not used for now 
            //  depthStencilAttachment: depth_attachment, 
        };


        // 🖌️ Encode drawing commands
        this.m_currentPassEncoder = this.m_drawCommandEncoder.beginRenderPass(renderPassDescriptor);
        // this.m_currentPassEncoder.setViewport(0, 0, this.m_bufferSize[0], this.m_bufferSize[1], 0, 1);
        // this.m_currentPassEncoder.setScissorRect(0, 0, this.m_bufferSize[0], this.m_bufferSize[1]);

        this.m_framework.context.currentRenderPassEncoder = this.m_currentPassEncoder;
        this.m_framework.spriteRenderer.beginFrame();
    }

    public destroy (): void {
    }

    public endDraw (): void {

        this.m_framework.spriteRenderer.endFrame();
        this.m_currentPassEncoder.end();

        this.device.queue.submit([
            this.m_drawCommandEncoder.finish()
        ]);
    }

    /**
       * Initialize the WebGPU renderer.
       */
    public async initialize (): Promise<void> {

        this.m_bufferSize = new Vec2(this.m_framework.window.width, this.m_framework.window.height);
        this.clearColor = Color.lightPink();

        this.m_framework.window.subscribeToWindowResized((event) => {
            this.m_bufferSize[0] = event.width;
            this.m_bufferSize[1] = event.height;
        });

        const adapter = await navigator.gpu.requestAdapter({
            powerPreference: "high-performance"
        });

        if (!adapter) {
            throw new Error("WebGPURenderer::initialize: WebGPU cannot be initialized. Adapter not found.");
        }

        this.device = await adapter.requestDevice();
        this.m_framework.context.device = this.device;

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
        this.m_bufferSize[0] = this.m_framework.window.width;
        this.m_bufferSize[1] = this.m_framework.window.height;

        // CANVAS CONTEXT
        if (!this.m_gpuContext) {
            this.m_gpuContext = this.m_framework.window.canvas.getContext('webgpu');
            this.m_gpuContext.configure({
                device: this.device,
                alphaMode: "opaque",
                // size: [this.m_canvas.width * window.devicePixelRatio, this.m_canvas.height * window.devicePixelRatio],
                // format: format,
                format: 'bgra8unorm',
                //  usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
            });
        }

        // DEPTH TEXTURE
        // this.m_depthTexture = this.device.createTexture({
        //     size: [this.m_bufferSize.x, this.m_bufferSize.y, 1],
        //     format: 'depth24plus-stencil8',
        //     usage: GPUTextureUsage.RENDER_ATTACHMENT
        // });
    }

    // #endregion Private Methods (1)
}