import { Effect } from "./Effect";
import sourceCode from "../../shaders/effects/blur.wgsl?raw"
import { Texture2D } from "../textures/Texture2D";

export class BlurEffect extends Effect {


    private m_horizontalPassPipeline: GPURenderPipeline;
    private m_horizontalPassTexture: Texture2D;
    private m_horizontalPassTextureBindGroup: GPUBindGroup;

    private m_verticalPassPipeline: GPURenderPipeline;
    private m_verticalPassTexture: Texture2D;
    private m_verticalPassTextureBindGroup: GPUBindGroup;

    protected sourceCode (): string {
        return sourceCode;
    }

    public get sourceTexture (): Texture2D {
        return this.m_horizontalPassTexture;
    }

    /** 
     * Creates the bind groups.
     * Internally this method is called by the initialize method.
     * Internally creates @see {@link m_horizontalPassTextureBindGroup} and @see {@link m_verticalPassTextureBindGroup}
     */
    protected createBindGroups (layouts: GPUBindGroupLayout[]): Array<GPUBindGroup> {

        if (!this.m_sourceTextureBindGroupLayout) {
            throw new Error("Source texture bind group layout is not initialized.");
        }

        if (this.m_verticalPassTexture == undefined || this.m_horizontalPassTexture == undefined) {
            throw new Error("Horizontal or vertical pass texture is not initialized.");
        }

        // HORIZONTAL
        this.m_horizontalPassTextureBindGroup = this.m_device.createBindGroup({
            layout: this.m_sourceTextureBindGroupLayout,
            label: "Horizontal Pass Texture Bind Group",
            entries: [
                {
                    binding: 0,
                    resource: this.m_horizontalPassTexture.sampler
                },
                {
                    binding: 1,
                    resource: this.m_horizontalPassTexture.texture.createView(),
                }
            ]
        });

        // VERTICAL
        this.m_verticalPassTextureBindGroup = this.m_device.createBindGroup({
            layout: this.m_sourceTextureBindGroupLayout,
            label: "Vertical Pass Texture Bind Group",
            entries: [
                {
                    binding: 0,
                    resource: this.m_verticalPassTexture.sampler
                },
                {
                    binding: 1,
                    resource: this.m_verticalPassTexture.texture.createView(),
                }
            ]
        });

        return [this.m_horizontalPassTextureBindGroup, this.m_verticalPassTextureBindGroup];
    }

    public async initialize (): Promise<void> {

        this.m_device = this.m_framework.renderer.device;
        this.m_buffer = this.createVertexBuffer();

        const bufferSize = this.m_framework.renderer.bufferSize;

        // Create textures
        this.m_horizontalPassTexture = await this.m_framework.textureManager.createEmpty(bufferSize.x, bufferSize.y,
            undefined, {
            textureUsage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
            label: "Horizontal Pass Texture",
            textureFormat: "bgra8unorm"
        });

        this.m_verticalPassTexture = await this.m_framework.textureManager.createEmpty(bufferSize.x, bufferSize.y,
            undefined, {
            textureUsage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
            label: "Vertical Pass Texture",
            textureFormat: "bgra8unorm"
        });

        // Bind groups
        const layout = this.createBindGroupLayouts();
        this.createBindGroups(layout);

        // Create pipelines
        const shaderSource = this.sourceCode();
        const shaderModule = this.m_device.createShaderModule({
            code: shaderSource
        });

        const pipelineLayout = this.m_device.createPipelineLayout({
            bindGroupLayouts: layout
        });

        const vertexState: GPUVertexState = {
            module: shaderModule,
            entryPoint: "vs_main",
            buffers: [{
                arrayStride: 4 * 5,
                attributes: [{
                    // position
                    shaderLocation: 0,
                    offset: 0,
                    format: "float32x3"
                },
                {
                    // tex coords
                    shaderLocation: 1,
                    offset: 4 * 3,
                    format: "float32x2"
                }
                ]
            }]
        };

        const primitiveState: GPUPrimitiveState = {
            topology: "triangle-list"
        };

        this.m_horizontalPassPipeline = this.m_device.createRenderPipeline({
            label: "Horizontal Pass Pipeline",
            layout: pipelineLayout,
            vertex: vertexState,
            fragment: {
                module: shaderModule,
                entryPoint: "fs_horizontal",
                targets: [{
                    format: "bgra8unorm"
                }]
            },
            primitive: primitiveState
        });

        this.m_verticalPassPipeline = this.m_device.createRenderPipeline({
            label: "Vertical Pass Pipeline",
            layout: pipelineLayout,
            vertex: vertexState,
            fragment: {
                module: shaderModule,
                entryPoint: "fs_vertical",
                targets: [{
                    format: "bgra8unorm"
                }]
            },
            primitive: primitiveState
        });
    }

    /**
     * @inheritdoc
     */
    public draw (destinationTexture: GPUTexture): void {
        const device = this.m_framework.renderer.device;


        // HORIZONTAL PASS
        const horizontalPassEncoder = device.createCommandEncoder({
            label: "Horizontal Pass Encoder"
        });

        const horizontalRenderPass = horizontalPassEncoder.beginRenderPass({
            label: "Horizontal Pass Render Pass",
            colorAttachments: [{
                view: this.m_verticalPassTexture.texture.createView(),
                loadOp: "clear",
                storeOp: "store"
            }]
        });

        horizontalRenderPass.setPipeline(this.m_horizontalPassPipeline);
        horizontalRenderPass.setVertexBuffer(0, this.m_buffer);
        horizontalRenderPass.setBindGroup(0, this.m_horizontalPassTextureBindGroup);
        horizontalRenderPass.draw(6, 1, 0, 0);

        horizontalRenderPass.end();
        device.queue.submit([ horizontalPassEncoder.finish()]);

        // VERTICAL PASS
        const verticalPassEncoder = device.createCommandEncoder({
            label: "Vertical Pass Encoder"
        });

        const verticalRenderPass = verticalPassEncoder.beginRenderPass({
            label: "Vertical Pass Render Pass",
            colorAttachments: [{
                view: destinationTexture.createView(),
                loadOp: "clear",
                storeOp: "store"
            }]
        });

        verticalRenderPass.setPipeline(this.m_verticalPassPipeline);
        verticalRenderPass.setVertexBuffer(0, this.m_buffer);
        verticalRenderPass.setBindGroup(0, this.m_verticalPassTextureBindGroup);
        verticalRenderPass.draw(6, 1, 0, 0);

        verticalRenderPass.end();
        device.queue.submit([ verticalPassEncoder.finish()]);
    }

}