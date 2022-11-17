
import { FileLoader } from "../../framework/bones_loaders";
import { Mat4x4, Color } from "../../framework/bones_math";
import { SpriteShader } from "../../framework/shaders/SpriteShader";
import { GPUShader, GPU_BIND_GROUP_OFFSET } from "./GPUShader";

export class GPUSpriteShader extends GPUShader implements SpriteShader
{
    /**
     * Buffer that contains projection, view matrix.
     */
    private m_cameraMatricesBuffer: GPUBuffer;

    /**
     * Buffer for transform matrix.
     */
    private m_transformBuffer: GPUBuffer;

    /**
     * Buffer for tint color. 
     */
    private m_tintColorBuffer: GPUBuffer;


    /**
     * The constructor.
     * @param { GPUDevice  } device - the gpu device.
     * @param { FileLoader } m_fileLoader - the file loader.
     */
    constructor(device: GPUDevice, private readonly m_fileLoader: FileLoader)
    {
        super(device);

        this.m_options =
        {
            // describe the shader layouts
            vertexLayouts: [
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
    }


    /**
     * Initialize the shader.
     */
    public async initialize (): Promise<void>
    {
        this.m_vertexSource = await this.m_fileLoader.loadFile("assets/framework/shaders/sprite/gpu/sprite_v.wgsl")
        this.m_fragmentSource = await this.m_fileLoader.loadFile("assets/framework/shaders/sprite/gpu/sprite_f.wgsl");

        // most of initialize is in main, or super class
        // such as creation of pipeline.
        super.initialize();

        // UNIFORMS 

        // PER PASS
        this.m_cameraMatricesBuffer = this.m_device.createBuffer({
            // 2 4x4matrices
            // projection, view
            size: 2 * 16 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.m_bindGroupPerPass = this.m_device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [{
                binding: 0,
                resource: {
                    buffer: this.m_cameraMatricesBuffer
                }
            }]
        });

        // PER INSTANCE
        this.m_transformBuffer = this.m_device.createBuffer({
            size: 16 * 4 * 256,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.m_tintColorBuffer = this.m_device.createBuffer({
            size: 4 * 4 * 256, // vec4
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        let offset = 0;
        for (let i = 0; i < 10; i++)
        {
            const bind_group = this.m_device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(1),
                entries: [
                    {
                        binding: 0,
                        resource: {
                            offset,
                            buffer: this.m_transformBuffer,
                            size: 16 * 4
                        }
                    },
                    {
                        binding: 1,
                        resource: {
                            offset,
                            size: 4 * 4,
                            buffer: this.m_tintColorBuffer
                        }
                    }
                    // {
                    //     binding: 2,
                    //     resource: sampler 
                    // }
                ]
            });
            this.m_bindGroupPerInstance.push({ bindGroup: bind_group, offset, index: 1 });
            // 256, must be 256 aligned
            offset += GPU_BIND_GROUP_OFFSET;
        }


    }

    /**
     * Uses the pipeline, or rather sets the pipeline to pass encoder.
     * @param { GPURenderPassEncoder } pass_encoder 
     */
    public use<T1> (pass_encoder: T1): void
    {
        this.m_currentPassEncoder = pass_encoder as unknown as GPURenderPassEncoder;
        this.m_currentPassEncoder.setPipeline(this.pipeline);

        this.m_currentInstanceIndex = 0;
    }

    /**
     * Use the projection and view matrix.
     *
     * @param { Mat4x4 } projection_matrix
     * @param { Mat4x4 } view_matrix
     */
    public useCamera (projection_matrix: Mat4x4, view_matrix: Mat4x4): void
    {
        this.m_currentPassEncoder.setBindGroup(0, this.m_bindGroupPerPass);
        this.m_device.queue.writeBuffer(this.m_cameraMatricesBuffer, 0, projection_matrix.buffer, projection_matrix.byteOffset, projection_matrix.byteLength);
        this.m_device.queue.writeBuffer(this.m_cameraMatricesBuffer, 64, view_matrix.buffer, view_matrix.byteOffset, view_matrix.byteLength);
    }

    /**
     * Use the transform matrix.
     *
     * @param { Mat4x4 } transform_matrix
     */
    public useTransform (transform_matrix: Mat4x4): void
    {
        this.m_device.queue.writeBuffer(this.m_transformBuffer, this.m_bindGroupPerInstance[this.m_currentInstanceIndex].offset, transform_matrix.buffer, transform_matrix.byteOffset, transform_matrix.byteLength);
    }

    /**
     * Use the tint color.
     * 
     * @param { Color } color 
     */
    public useTintColor (color: Color): void
    {
        this.m_device.queue.writeBuffer(this.m_tintColorBuffer, this.m_bindGroupPerInstance[this.m_currentInstanceIndex].offset, color.buffer, color.byteOffset, color.byteLength);
    }


}