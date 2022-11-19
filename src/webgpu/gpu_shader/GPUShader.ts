import { Shader, ShaderUniform, ShaderUniformType } from "../../framework/shaders/Shader";

export class GPUShaderOptions 
{
    /**
     * The vertex shader layouts. Describe layout from vertex buffer.
     */
    vertexLayouts?: Array<GPUVertexBufferLayout>;
}

/**
 * The offset or alignment that needs to be between various groups.
 * Used within createBindGroup
 */
export const GPU_BIND_GROUP_OFFSET = 256;


export class PerInstanceGPUBindGroup
{
    /**
     * The offset. Must be 256 aligned.
     */
    public offset: number;

    /**
     * The created bing group.
     */
    public bindGroup: GPUBindGroup;

    /**
     * Index when calling bind group.
     */
    public index: number;
}

/**
 * The GPUShader which handles WebGPUShaderPipeline.
 */
export abstract class GPUShader implements Shader 
{
    /**
     * The GPURenderPipeline. Handles shaders.
     */
    public pipeline: GPURenderPipeline;

    /**
     * The number of currently bound instance.
     */
    protected m_currentInstanceIndex: number = 0;

    /**
     * Bind group used 1 time per pass.
     */
    protected m_bindGroupPerPass: GPUBindGroup;

    /**
     * The bind group for a shader, instance uniforms.
     * Index is instance number.
     */
    protected m_bindGroupPerInstance: Array<PerInstanceGPUBindGroup> = [];

    /**
     * The current pass enocoder.
     */
    protected m_currentPassEncoder: GPURenderPassEncoder;


    /**
     * The constructor.
     * @param { GPUDevice } m_device - the device to create shader pipeline for.
     * @param { string } m_vertexSource - the source of vertex shader.
     * @param { string } m_fragmentSource - the source of fragment shader.
     */
    constructor(protected readonly m_device: GPUDevice,
        protected m_vertexSource?: string,
        protected m_fragmentSource?: string,
        protected m_options?: GPUShaderOptions)
    { }



    /**
     * Creates the depth stencil state for a pipeline.
     * @returns { GPUDepthStencilState }
     */
    protected createDepthStencilState (): GPUDepthStencilState 
    {
        return {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus-stencil8'
        };
    }

    /**
     * Creates the primitive state. For rasterization.
     * @returns { GPUPrimitiveState }
     */
    protected createPrimitiveState (): GPUPrimitiveState 
    {
        return {
            frontFace: 'cw',
            cullMode: 'none',
            topology: 'triangle-list'
        };
    }

    /**
     * Initialize the GPUShader.
     */
    public async initialize (): Promise<void>
    {
        // Shaders first 
        const vertex_shader = this.m_device.createShaderModule({
            code: this.m_vertexSource
        });
        const fragment_shader = this.m_device.createShaderModule({
            code: this.m_fragmentSource
        });

        // 🎭 Shader Stages
        const vertex: GPUVertexState = {
            module: vertex_shader,
            entryPoint: 'main',
            buffers: this.m_options.vertexLayouts
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
            primitive: this.createPrimitiveState(),
            depthStencil: this.createDepthStencilState()
        };
        this.pipeline = this.m_device.createRenderPipeline(pipelineDesc);
    }

    /**
     * Uses the pipeline, or rather sets the pipeline to pass encoder.
     */
    public use<T1> (pass_encoder: T1): void
    {
        (pass_encoder as unknown as GPURenderPassEncoder).setPipeline(this.pipeline);
    }

    /**
     * Used by WebGPU. If there is per instance uniforms, use this to bind and prepare uniforms.
     * @param { number } instance_index 
     */
    public bindInstance (instance_index: number): void 
    {
        this.m_currentInstanceIndex = instance_index;
        this.m_currentPassEncoder.setBindGroup(1, this.m_bindGroupPerInstance[this.m_currentInstanceIndex].bindGroup);
    }

    /**
     * Destroys the shader.
     */
    public destroy (): void
    {
        throw new Error("Method not implemented.");
    }

    uniformValues: { [id: string]: ShaderUniform; };
    createUniform (uniform_name: string, type: ShaderUniformType, key?: string): ShaderUniform
    {
        throw new Error("Method not implemented.");
    }

}