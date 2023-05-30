import { BlendMode } from "../../../SpriteRenderer";

/**
 * Util class for working with @see {@link WebGPURenderPipeline}
 */
export class WebGPURenderPipelineUtil 
{
    // #region Properties (1)

    private static blendsCache: Map<BlendMode, { color: GPUBlendComponent, alpha: GPUBlendComponent }> = new Map();

    // #endregion Properties (1)

    // #region Public Static Methods (2)

    /**
     * Creates the fragment state @see {@link GPUFragmentState}
     * @param shaderModule - the shader module
     * @param entryPoint - the entry point. By default 'fs_main'
     * @returns 
     */
    public static createFragmentState (shaderModule: GPUShaderModule, entryPoint: string = "fs_main", blendMode: BlendMode = BlendMode.AlphaBlending): GPUFragmentState
    {
        // Blend state of (1 * src) + ((1 - src_alpha) * dst)
        const blend = this.createBlend(blendMode);

        const fragmentState: GPUFragmentState = {
            module: shaderModule,
            targets: [{
                format: 'bgra8unorm',
                blend: {
                    // https://learnopengl.com/Advanced-OpenGL/Blending#:~:text=Blending%20in%20OpenGL%20is%20commonly,behind%20it%20with%20varying%20intensity.
                    // https://wgpu.rs/doc/src/wgpu_types/lib.rs.html#1496
                    color: blend.color,
                    alpha: blend.alpha,
                },
                writeMask: GPUColorWrite.ALL,
            }],
            entryPoint: entryPoint
        }

        return fragmentState;
    }

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

    // #endregion Public Static Methods (2)

    // #region Private Static Methods (1)

    /**
     * Create the blend state depending on the blend mode.
     * @param mode 
     * @returns 
     */
    private static createBlend (mode: BlendMode): { color: GPUBlendComponent, alpha: GPUBlendComponent }
    {
        if (mode == BlendMode.AlphaBlending)
        {
            this.blendsCache[mode] = {
                color: {
                    srcFactor: "one",
                    dstFactor: 'one-minus-src-alpha',
                    operation: "add"
                },
                alpha: {
                    srcFactor: "one",
                    dstFactor: "one-minus-src-alpha",
                    operation: "add"
                }
            };
        }
        else if(mode == BlendMode.AdditiveBlending){
            this.blendsCache[mode] = {
                color: {
                    srcFactor: "one",
                    dstFactor: "one",
                    operation: "add",
                  },
                  alpha: {
                    srcFactor: "one",
                    dstFactor: "one",
                    operation: "add",
                  },
            }
        }
        else if (mode == BlendMode.MultiplicativeBlending)
        {
            this.blendsCache[mode] = { 
                color: {
                    srcFactor: "dst",
                    dstFactor: "zero",
                    operation: "add",
                },
                alpha: {
                    srcFactor: "dst-alpha",
                    dstFactor: "zero",
                    operation: "add",
                }
            }
        }
        else if(mode == BlendMode.PreMultipliedAlphaBlending){
            this.blendsCache[mode] = { 
                color: {
                    srcFactor: "one",
                    dstFactor: "one-minus-src-alpha",
                    operation: "add",
                },
                alpha: {
                    srcFactor: "one",
                    dstFactor: "one-minus-src-alpha",
                    operation: "add",
                }
            }
        }
        else if(mode == BlendMode.InteropolativeBlending)
        {
            this.blendsCache[mode] = { 
                color: {
                    srcFactor: 'src-alpha',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add',
                },
                alpha: {
                    srcFactor: "src-alpha",
                    dstFactor: "one-minus-src-alpha",
                    operation: "add",
                }
            }
        }
        else
        {
            throw new Error("Not implemented");
        }

        return this.blendsCache[mode];
    }

    // #endregion Private Static Methods (1)
}