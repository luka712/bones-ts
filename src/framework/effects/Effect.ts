import { Framework } from "../Framework";
import { Texture2D } from "../textures/Texture2D";
import { WebGPUUtil } from "../util/WebGPUUtil";

export abstract class Effect {

    protected m_device: GPUDevice;

    // position, tex coords buffer
    protected m_buffer: GPUBuffer;

    // The render pipeline.
    protected m_pipeline: GPURenderPipeline;

    // The bind group layout for the source texture.
    protected m_sourceTextureBindGroupLayout: GPUBindGroupLayout;

    //  The bind group for the source texture.
    protected m_sourceTextureBindGroup: GPUBindGroup;

    private m_sourceTexture: Texture2D;

    /**
     * The source texture.
     * This is the texture we want to apply the effect to.
     * Usually this is the texture that was rendered to the screen.
     */
    public get sourceTexture(): Texture2D
    {
        return this.m_sourceTexture;
    }

    constructor(protected m_framework: Framework) {
        this.m_device = this.m_framework.context.device;
    }

    protected abstract sourceCode (): string;

    /**
     * Creates the vertex buffer for the effect.
     * @returns @see {@link GPUBuffer}
     */
    protected createVertexBuffer (): GPUBuffer {
        const data = new Float32Array([
            // position, tex coords
            -1, 1, 0, 0, 0,  // top left
            -1, -1, 0, 0, 1, // bottom left
            1, -1, 0, 1, 1,  // bottom right

            -1, 1, 0, 0, 0, // top left
            1, -1, 0, 1, 1, // bottom right
            1, 1, 0, 1, 0   // top right
        ]);

        return WebGPUUtil.buffer.createVertexBuffer(this.m_device, data, "Effect Vertex Buffer");
    }

    /**
     * Creates the bind group layouts.
     * Internally this method is called by the initialize method.
     * Internally creates @see {@link m_sourceTextureBindGroupLayout}
     * @returns @see {@link Array} of {@link GPUBindGroupLayout}
     */
    protected createBindGroupLayouts (): Array<GPUBindGroupLayout> {
        this.m_sourceTextureBindGroupLayout = this.m_device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: {}
            },
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {}
            }
            ]
        });

        return [this.m_sourceTextureBindGroupLayout];
    }

    /**
     * Creates the bind groups.
     * @param layouts @see {@link Array} of {@link GPUBindGroupLayout}
     * Internally this method is called by the initialize method.
     * Internally creates @see {@link m_sourceTextureBindGroup}
     * @returns @see {@link Array} of {@link GPUBindGroup}
     */
    protected createBindGroups (layouts: Array<GPUBindGroupLayout>): Array<GPUBindGroup> {

        this.m_sourceTextureBindGroup = this.m_device.createBindGroup({
            layout: this.m_sourceTextureBindGroupLayout,
            entries: [{
                binding: 0,
                resource: this.sourceTexture.sampler
            },
            {
                binding: 1,
                resource: this.sourceTexture.texture.createView()
            }
            ]
        });

        return [this.m_sourceTextureBindGroup];
    }

    /**
     * Creates the render pipeline.
     * @param layouts @see {@link Array} of {@link GPUBindGroupLayout}
     */
    protected createRenderPipeline (layouts: Array<GPUBindGroupLayout>): GPURenderPipeline {
        const shaderModule = this.m_device.createShaderModule({
            code: this.sourceCode()
        });

        const pipelineLayout = this.m_device.createPipelineLayout({
            bindGroupLayouts: layouts
        });

        return this.m_device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: shaderModule,
                entryPoint: "vs_main",
                buffers: [{
                    arrayStride: Float32Array.BYTES_PER_ELEMENT * 5,
                    attributes: [{
                        // position
                        shaderLocation: 0,
                        offset: 0,
                        format: "float32x3"
                    },
                    {
                        // tex coords
                        shaderLocation: 1,
                        offset: Float32Array.BYTES_PER_ELEMENT * 3,
                        format: "float32x2"
                    }
                    ]
                }]
            },
            fragment: {
                module: shaderModule,
                entryPoint: "fs_main",
                targets: [{
                    format: "bgra8unorm"
                }]
            },
            primitive: {
                topology: "triangle-list"
            }
        });
    }

    public async initialize (): Promise<void> {
        this.m_device = this.m_framework.context.device;

        const bufferSize = this.m_framework.renderer.bufferSize;
        this.m_sourceTexture = await this.m_framework.textureManager.createEmpty(bufferSize.x, bufferSize.y, undefined, {
            label: "Effect Source Texture",
            textureFormat: "bgra8unorm",
            textureUsage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT
        });

        this.m_buffer = this.createVertexBuffer();

        const layouts = this.createBindGroupLayouts();
        const groups = this.createBindGroups(layouts);

        this.m_pipeline = this.createRenderPipeline(layouts);
    }

    /**
     * Draws the effect to the destination texture.
     * @param destinationTexture @see {@link GPUTexture} The destination texture. Usually the texture that was rendered to the screen.
     */
    public draw (destinationTexture: GPUTexture) : void {
        // Create a command encoder and pass in the render pass descriptor.
        // Needs to be created for new texture.
        // Render to texture
        const commandEncoder = this.m_device.createCommandEncoder();

        const passEncoder = commandEncoder.beginRenderPass({
            label: "Effect Pass",
            colorAttachments: [{
                view: destinationTexture.createView(),
                loadOp: "clear",
                storeOp: "store"
            }]
        });

        passEncoder.setPipeline(this.m_pipeline);
        passEncoder.setVertexBuffer(0, this.m_buffer);
        passEncoder.setBindGroup(0, this.m_sourceTextureBindGroup);
        passEncoder.draw(6, 1, 0, 0);

        passEncoder.end();
        this.m_device.queue.submit([commandEncoder.finish()]);
    }

    public destroy (): void {
        this.sourceTexture.destroy();
    }
}