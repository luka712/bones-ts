import { IGeometry } from "../framework/bones_geometry";
import { FileLoader } from "../framework/bones_loaders";
import { Color, Mat4x4, Rect, Vec2 } from "../framework/bones_math";
import { IRenderer } from "../framework/bones_renderer";
import { BufferUsage, ComponentType, GeometryBuffer } from "../framework/GeometryBuffer";
import { Shader } from "../framework/shaders/Shader";
import { SpriteShader } from "../framework/shaders/SpriteShader";
import { SpriteRenderer } from "../framework/SpriteRenderer";
import { WindowManager } from "../framework/Window";
import { WebGPUGeometryBuffer } from "./WebGPUGeometryBuffer";

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

// TEMPORARY TEST DATA 
// 📈 Position Vertex Buffer Data
const positions = new Float32Array([
    1.0, -1.0, 0.0,
    -1.0, -1.0, 0.0,
    0.0, 1.0, 0.0
]);

// 🎨 Color Vertex Buffer Data
const colors = new Float32Array([
    1.0, 0.0, 0.0, // 🔴
    0.0, 1.0, 0.0, // 🟢
    0.0, 0.0, 1.0  // 🔵
]);

// 📇 Index Buffer Data
const indices = new Uint16Array([0, 1, 2]);
// END TEMPORARY TEST DATA 

/**
 * The WebGPU renderer.
 */
export class WebGPURenderer implements IRenderer
{

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
     * The render pipeline.
     */
    private m_pipeline: GPURenderPipeline;

    /**
     * The view of a color texture.
     */
    private m_colorTextureView: GPUTextureView;

    /**
     * The view of a depth texture.
     */
    private m_depthTextureView: GPUTextureView;

    // TEST
    private positionBuffer: GPUBuffer;
    private indexBuffer: GPUBuffer;
    private colorBuffer: GPUBuffer;
    private geometryBuffer: GeometryBuffer;

    /**
     * The sprite renderer.
     */
    public spriteRenderer: SpriteRenderer;

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
    constructor(private readonly m_canvas: HTMLCanvasElement, private readonly m_window: WindowManager)
    {
        // @see https://medium.com/@carmencincotti/drawing-a-triangle-with-webgpu-53d48fb1ba8

        if (!navigator.gpu)
        {
            throw new Error("WebGPURenderer::constructor: WebGPU cannot be initialized. Window.navigator.gpu not found.");
        }


        this.m_bufferSize = new Vec2(m_canvas.width, m_canvas.height);
        this.clearColor = Color.lightPink();

        this.m_window.subscribeToWindowResized((event) => 
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

        // CANVAS CONTEXT
        if (!this.m_gpuContext)
        {
            this.m_gpuContext = this.m_canvas.getContext('webgpu');
            const format = navigator.gpu.getPreferredCanvasFormat();
            this.m_gpuContext.configure({
                device: this.device,
                alphaMode: "opaque",
                size: [this.m_canvas.width * window.devicePixelRatio, this.m_canvas.height * window.devicePixelRatio],
                format: format,
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
            });
        }

        // DEPTH TEXTURE
        const depth_texture = this.device.createTexture({
            size: [this.m_bufferSize.x, this.m_bufferSize.y, 1],
            dimension: '2d',
            format: 'depth24plus-stencil8',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
        });
        this.m_depthTextureView = depth_texture.createView();
    }

    // 🍱 Initialize resources to render triangle (buffers, shaders, pipeline)
    private async initTestData (): Promise<void> 
    {
        // // 🔺 Buffers
        // let createBuffer = (arr: Float32Array | Uint16Array, usage: number) => {
        //     // 📏 Align to 4 bytes (thanks @chrimsonite)
        //     let desc = {
        //         size: (arr.byteLength + 3) & ~3,
        //         usage,
        //         mappedAtCreation: true
        //     };
        //     let buffer = this.device.createBuffer(desc);
        //     const writeArray =
        //         arr instanceof Uint16Array
        //             ? new Uint16Array(buffer.getMappedRange())
        //             : new Float32Array(buffer.getMappedRange());
        //     writeArray.set(arr);
        //     buffer.unmap();
        //     return buffer;
        // };

        // this.positionBuffer = createBuffer(positions, GPUBufferUsage.VERTEX);
        // this.colorBuffer = createBuffer(colors, GPUBufferUsage.VERTEX);
        // this.indexBuffer = createBuffer(indices, GPUBufferUsage.INDEX);

        this.geometryBuffer = new WebGPUGeometryBuffer(this.device, [
            {
                data: positions,
                componentType: ComponentType.FLOAT,
                layoutLocation: 0,

                // todo
                isPositionBuffer: false,
                vertexSize: 0,
                count: 0,
                bufferUsage: BufferUsage.DYNAMIC_DRAW

            },
            {
                data: colors,
                componentType: ComponentType.FLOAT,
                layoutLocation: 1,

                   // todo
                   isPositionBuffer: false,
                   vertexSize: 0,
                   count: 0,
                   bufferUsage: BufferUsage.DYNAMIC_DRAW
            }
        ], {
            data: indices,
            componentType: ComponentType.UNSIGNED_SHORT,
            count: 3,

               // todo
               bufferUsage: BufferUsage.DYNAMIC_DRAW
        });

        //  // 🔣 Input Assembly
        //  const positionAttribDesc: GPUVertexAttribute = {
        //     shaderLocation: 0, // [[attribute(0)]]
        //     offset: 0,
        //     format: 'float32x3'
        // };
        // const colorAttribDesc: GPUVertexAttribute = {
        //     shaderLocation: 1, // [[attribute(1)]]
        //     offset: 0,
        //     format: 'float32x3'
        // };
        // const positionBufferDesc: GPUVertexBufferLayout = {
        //     attributes: [positionAttribDesc],
        //     arrayStride: 4 * 3, // sizeof(float) * 3
        //     stepMode: 'vertex'
        // };
        // const colorBufferDesc: GPUVertexBufferLayout = {
        //     attributes: [colorAttribDesc],
        //     arrayStride: 4 * 3, // sizeof(float) * 3
        //     stepMode: 'vertex'
        // };

        // 🌀 Color/Blend State
        // const colorState: GPUColorTargetState = {
        //     format: 'bgra8unorm',
        //     writeMask: GPUColorWrite.ALL
        // };

        // const fragment: GPUFragmentState = {
        //     module: fragment_shader,
        //     entryPoint: 'main',
        //     targets: [colorState]
        // };

        // @ts-ignore
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

        this.device = await adapter.requestDevice();
        this.device.lost.then(() => 
        {
            throw new Error("WebGPURenderer::initialize: WebGPU cannot be initialized. Device has been lost.");
        });

        // now call resize
        // create context and depth texture/depth texture view
        this.resize();

        // END INIT

        // temporary test data
        await this.initTestData();
        // await this.shader.initialize();
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
            depthStencilAttachment: depth_attachment
        };

        const command_encoder = this.device.createCommandEncoder();

        // TODO: 
        // read: https://toji.github.io/webgpu-gltf-case-study/

        // 🖌️ Encode drawing commands
        const pass_encoder: GPURenderPassEncoder = command_encoder.beginRenderPass(render_pass_desc);
        pass_encoder.setViewport(0, 0, this.m_bufferSize[0], this.m_bufferSize[1], 0, 1);
        pass_encoder.setScissorRect(0, 0, this.m_bufferSize[0], this.m_bufferSize[1]);

        // called beginFrame
        this.spriteRenderer.beginRenderPass(pass_encoder);

        this.spriteRenderer.begin();

        this.spriteRenderer.draw(null, new Rect(0,0, 128,128), Color.green());
        this.spriteRenderer.draw(null, new Rect(128,128, 128,128), Color.red());

        // this.spriteRenderer.end();

        //     this.shader.use(pass_encoder);
        //     this.geometryBuffer.bind(pass_encoder);
        //     this.shader.bindInstance(0);
        //     this.shader.useTransform(Mat4x4.translationMatrix(1, 1, 0));
        //     this.shader.useCamera(Mat4x4.identity(), Mat4x4.identity());
        //    // this.shader.useTintColor(Color.red());
        //     this.geometryBuffer.draw(pass_encoder);

        //     this.shader.bindInstance(1);
        //     this.shader.useCamera(Mat4x4.identity(), Mat4x4.identity());
        //     this.shader.useTransform(Mat4x4.identity());
        //    // this.shader.useTintColor(Color.green());
        //     this.geometryBuffer.draw(pass_encoder);

        this.spriteRenderer.begin();

        this.spriteRenderer.draw(null, new Rect(300, 300, 166,22), Color.blue());
        this.spriteRenderer.draw(null, new Rect(50, 50,32,32), Color.lightGray());

        // this.spriteRenderer.end();

        //     this.shader.use(pass_encoder);
        //     this.geometryBuffer.bind(pass_encoder);
        //     this.shader.bindInstance(0);
        //     this.shader.useTransform(Mat4x4.translationMatrix(1, 1, 0));
        //     this.shader.useCamera(Mat4x4.identity(), Mat4x4.identity());
        //    // this.shader.useTintColor(Color.red());
        //     this.geometryBuffer.draw(pass_encoder);

        //     this.shader.bindInstance(1);
        //     this.shader.useCamera(Mat4x4.identity(), Mat4x4.identity());
        //     this.shader.useTransform(Mat4x4.identity());
        //    // this.shader.useTintColor(Color.green());
        //     this.geometryBuffer.draw(pass_encoder);

        pass_encoder.end();

        const command_buffer = command_encoder.finish();
        this.device.queue.submit([command_buffer]);
    }
    public endDraw (): void
    {
    }
    public destroy (): void
    {
    }

}