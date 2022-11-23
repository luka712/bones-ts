
import { FileLoader } from "../../framework/bones_loaders";
import { Mat4x4, Color } from "../../framework/bones_math";
import { WebGPUTexture2D } from "../textures/WebGPUTexture";
import { WebGPURendererContext } from "../WebGPURenderer";

/**
 * The offset or alignment that needs to be between various groups.
 * Used within createBindGroup
 */
const GPU_BIND_GROUP_OFFSET = 256;

export interface WebGPUSpritePipelineInstanceBuffers 
{
    transformBuffer: GPUBuffer;
    tintColorBuffer: GPUBuffer;
    bindGroup: GPUBindGroup;
}

export class WebGPUSpritePipeline
{
    /**
     * The pipeline.
     */
    public pipeline: GPURenderPipeline;

    /**
     * Updated only once per frame.
     */
    private m_cameraBindGroup: GPUBindGroup;

    /**
     * Buffer that contains projection, view matrix.
     */
    private m_cameraMatricesBuffer: GPUBuffer;

    /**
     * Buffers that are used for each instance of data.
     * Create collection of them and reuse them.
     */
    private readonly m_instanceBindGroup: Array<WebGPUSpritePipelineInstanceBuffers> = [];

    /**
     * The cached bind group for textures.
     */
    private readonly m_textureBindGroup: { [id: string]: GPUBindGroup } = {}

    /**
     * The instance index.
     */
    private m_instanceIndex: number = 0;


    /**
     * The constructor.
     * @param m_ctx the context.
     * @param m_fileLoader the file loader.
     */
    constructor(private readonly m_ctx: WebGPURendererContext, private readonly m_fileLoader: FileLoader)
    { }


    /**
     * Initialize the shader.
     */
    public async initialize (): Promise<void>
    {
        const device = this.m_ctx.device;

        const vertex_source = await this.m_fileLoader.loadFile("assets/framework/shaders/sprite/gpu/sprite_v.wgsl")
        const fragment_source = await this.m_fileLoader.loadFile("assets/framework/shaders/sprite/gpu/sprite_f.wgsl");

        // Shaders first 
        const vertex_shader = device.createShaderModule({
            code: vertex_source
        });
        const fragment_shader = device.createShaderModule({
            code: fragment_source
        });

        // 🎭 Shader Stages
        const vertex: GPUVertexState = {
            module: vertex_shader,
            entryPoint: 'main',
            buffers: [
                // POSITION
                {
                    arrayStride: 4 * 3, // float * 3
                    attributes: [
                        {
                            shaderLocation: 0,
                            format: 'float32x3',
                            offset: 0
                        }
                    ],
                    stepMode: 'vertex'
                },
                // TEX COORDS
                {
                    arrayStride: 4 * 2, // float * 2
                    attributes: [
                        {
                            shaderLocation: 1,
                            format: 'float32x2',
                            offset: 0
                        }
                    ],
                    stepMode: 'vertex'
                },
            ]
        };

        const fragment: GPUFragmentState = {
            module: fragment_shader,
            targets: [{
                format: 'bgra8unorm',
                writeMask: GPUColorWrite.ALL
            }],
            entryPoint: 'main'
        }

        const pipelineDesc: GPURenderPipelineDescriptor = {
            layout: 'auto',
            vertex: vertex,
            fragment: fragment,
            primitive: {
                frontFace: 'cw',
                cullMode: 'none',
                topology: 'triangle-list'
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus-stencil8'
            }
        };


        const pipeline = device.createRenderPipeline(pipelineDesc);

        // ONCE PER FRAME 
        this.m_cameraMatricesBuffer = device.createBuffer({
            // 2 4x4matrices
            // projection, view
            size: 2 * 16 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.m_cameraBindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [{
                binding: 0,
                resource: {
                    buffer: this.m_cameraMatricesBuffer
                }
            }]
        });

        this.pipeline = pipeline;
    }

    /**
     * Creates the buffer per instance of sprite.
     */
    private createInstanceBuffers (): WebGPUSpritePipelineInstanceBuffers
    {
        const device = this.m_ctx.device;

        // PER INSTANCE
        const transform_buffer = device.createBuffer({
            size: 16 * 4, // mat4
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        const tint_color_buffer = device.createBuffer({
            size: 4 * 4, // vec4
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        const bind_group = device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(1),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: transform_buffer,
                        size: 16 * 4
                    }
                },
                {
                    binding: 1,
                    resource: {
                        size: 4 * 4,
                        buffer: tint_color_buffer
                    }
                }
            ]
        });

        return {
            bindGroup: bind_group,
            transformBuffer: transform_buffer,
            tintColorBuffer: tint_color_buffer
        }

    }

    /**
     * When render pass has begun.
     */
    public beginRenderPass () 
    {
        this.m_instanceIndex = 0;
    }

    /**
     * Sets the pipeline and per frame pass uniforms.
     * @param projection_matrix - the projection matrix to use.
     * @param view_matrix - the view matrix to use.
     */
    public use (projection_matrix: Mat4x4, view_matrix: Mat4x4): void 
    {
        // use this pipeline
        const pass_encoder = this.m_ctx.currentRenderPassEncoder;
        pass_encoder.setPipeline(this.pipeline);

        // camera matrices need only to change once perframe. There is only one camera in scene.
        const device = this.m_ctx.device;
        pass_encoder.setBindGroup(0, this.m_cameraBindGroup);
        device.queue.writeBuffer(this.m_cameraMatricesBuffer, 0, projection_matrix.buffer, projection_matrix.byteOffset, projection_matrix.byteLength);
        device.queue.writeBuffer(this.m_cameraMatricesBuffer, 64, view_matrix.buffer, view_matrix.byteOffset, view_matrix.byteLength);
    }

    /**
     * Sets the instance data of this pipeline.
     * @param transform_matrix 
     * @param tint_color 
     * @param texture 
     */
    public setInstanceData (transform_matrix: Mat4x4, tint_color: Color, texture: WebGPUTexture2D): void 
    {
        // create or get from cache bind group.
        if (this.m_instanceIndex >= this.m_instanceBindGroup.length)
        {
            this.m_instanceBindGroup.push(this.createInstanceBuffers());
        }
        const instance_bind_group = this.m_instanceBindGroup[this.m_instanceIndex];

        const device = this.m_ctx.device;
        const pass_encoder = this.m_ctx.currentRenderPassEncoder;

        // uniforms
        pass_encoder.setBindGroup(1, instance_bind_group.bindGroup);
        device.queue.writeBuffer(instance_bind_group.transformBuffer, 0, transform_matrix.buffer, transform_matrix.byteOffset, transform_matrix.byteLength);
        device.queue.writeBuffer(instance_bind_group.tintColorBuffer, 0, tint_color.buffer, tint_color.byteOffset, tint_color.byteLength);

        // Texture.
        let texture_bind_group = this.m_textureBindGroup[texture.id];
        if (!texture_bind_group)
        {
            texture_bind_group = device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(2),
                entries: [
                    {
                        binding: 0,
                        resource: texture.sampler,
                    },
                    {
                        binding: 1,
                        resource: texture.texture.createView()
                    }
                ]
            });
        }
        pass_encoder.setBindGroup(2, texture_bind_group);

        this.m_instanceIndex++;
    }
}