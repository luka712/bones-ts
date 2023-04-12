
/**
 * Util class for working with @see {@link WebGPURenderPipeline}
 */
export class WebGPURenderPipelineUtil 
{
    // #region Public Static Methods (1)

    /**
     * Creates the default pipeline descriptor
     * @param pipelineLayout - the pipeline layout. 
     * @param vertexState - the vertex state.
     * @param fragmentState - the fragment state.
     * @param topology - the topology, by default 'triangle-list'
     * @param cullMode - the cull mode, by default 'none'
     * @returns 
     */
    public static createPipelineDescriptor (
        pipelineLayout: GPUPipelineLayout,
        vertexState: GPUVertexState, fragmentState: GPUFragmentState,
        topology: GPUPrimitiveTopology = "triangle-list",
        cullMode: GPUCullMode = "none"): GPURenderPipelineDescriptor
    {


        const pipelineDesc: GPURenderPipelineDescriptor = {
            layout: pipelineLayout,
            vertex: vertexState,
            fragment: fragmentState,
            primitive: {
                topology: topology,
                cullMode: cullMode
            },
            depthStencil: {
                format: "depth24plus-stencil8",
                depthWriteEnabled: true,
                depthCompare: "less-equal", // Very important, must be less equal otherwise it won't be able to resolve depths with same z depth value
            },
        };

        return pipelineDesc;
    }

    /**
     * Creates the fragment state @see {@link GPUFragmentState}
     * @param shaderModule - the shader module
     * @param entryPoint - the entry point. By default 'fs_main'
     * @returns 
     */
    public static createFragmentState (shaderModule: GPUShaderModule, entryPoint: string = "fs_main"): GPUFragmentState
    {
        const fragmentState: GPUFragmentState = {
            module: shaderModule,
            targets: [{
                format: 'bgra8unorm',
                blend: {
                    // https://learnopengl.com/Advanced-OpenGL/Blending#:~:text=Blending%20in%20OpenGL%20is%20commonly,behind%20it%20with%20varying%20intensity.
                    // https://wgpu.rs/doc/src/wgpu_types/lib.rs.html#1496
                    color: {
                        srcFactor: "src-alpha",
                        dstFactor: 'one-minus-src-alpha',
                        operation: "add"
                    },
                    alpha: {
                        // Blend state of (1 * src) + ((1 - src_alpha) * dst)
                        srcFactor: "one",
                        dstFactor: "one",
                        operation: "add"
                    },
                },
                writeMask: GPUColorWrite.ALL,
            }],
            entryPoint: entryPoint
        }

        return fragmentState;
    }

    // #endregion Public Static Methods (1)
}