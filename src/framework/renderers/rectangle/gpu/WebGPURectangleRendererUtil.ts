import shaderSource from "./rectangle.wgsl?raw"
import { WebGPUCameraBuffer } from "../../common/WebGPUCameraBuffer";

// pos3, tc2, col4
export const GPU_SPRITE_RENDERER_ATTRIBUTES_STRIDE = 3 * Float32Array.BYTES_PER_ELEMENT + 2 * Float32Array.BYTES_PER_ELEMENT + 4 * Float32Array.BYTES_PER_ELEMENT;

export interface WebGPURectangleRendererPart 
{
    // #region Properties (6)

    readonly colorBindGroup: GPUBindGroup;
    // color
    readonly colorUniformBuffer: GPUBuffer;
    readonly instanceStorageBuffer: GPUBuffer;
    // per instance layout
    readonly instanceViewBindGroup: GPUBindGroup;
    readonly pipeline: GPURenderPipeline;
    // global
    readonly projectionViewBindGroup: GPUBindGroup;

    // #endregion Properties (6)
}

export class WebGPURectangleRendererUtil 
{
    // #region Public Static Methods (1)

    /**
     * Craates the part 
     * Consists of pipeline, buffers, color and all the data that is needed to for rendering.
     * @param device 
     */
    public static createRectangleRenderPart (device: GPUDevice): WebGPURectangleRendererPart
    {
        // Shaders first 
        const shaderModule = device.createShaderModule({
            code: shaderSource
        });

        // 🎭 Shader Stages
        const vertexState: GPUVertexState = {
            module: shaderModule,
            entryPoint: 'vs_main',
            buffers: [
                {
                    arrayStride: Float32Array.BYTES_PER_ELEMENT * 2,
                    attributes: [
                        // POSITION
                        {
                            shaderLocation: 0,
                            format: "float32x2",
                            offset: 0
                        }
                    ],
                    stepMode: 'vertex'
                }
            ]
        };

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
            entryPoint: 'fs_main'
        }

        // UNIFORMS

        // GLOBAL UNIFORM BIND GROUP LAYOUT group(0)
        const projectionViewUniformsBindGroupLayout = device.createBindGroupLayout({
            label: "projectionViewLayout",
            entries: [
                {
                    // global uniform group(0) binding(0)
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        minBindingSize: 64
                    }
                },
            ],
        });

        const perInstanceGroupLayout = device.createBindGroupLayout({
            label: "perInstanceLayout",
            entries: [
                {
                    // per instance uniform group(1) binding(0)
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                }
            ]
        })

        // COLOR BING GROUP LAYOUT group(1)
        const colorBindGroupLayout = device.createBindGroupLayout({
            label: "colorLayout",
            entries: [
                {
                    // global uniform group(2) binding(0)
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        minBindingSize: 16
                    }
                },
            ],
        })

        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [
                projectionViewUniformsBindGroupLayout,
                perInstanceGroupLayout,
                colorBindGroupLayout
            ]
        });

        // uniform layout. Done only once per frame, not for instance.
        const projectionViewBindGroup = device.createBindGroup({
            layout: projectionViewUniformsBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: WebGPUCameraBuffer.projectionViewUniformBuffer // set like this, camera buffer is set in WebGPURenderer ,
                    },
                },]
        });

        const instanceStorageBuffer = device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * 4 * 5, // pos(vec2) + size(vec2) * 5 rects ( corners and middle)
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        })

        const instanceViewBindGroup = device.createBindGroup({
            layout: perInstanceGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: instanceStorageBuffer
                    }
                }
            ]
        })

        const colorUniformBuffer = device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // Create texture bind groupd and use it
        const colorBindGroup = device.createBindGroup({
            layout: colorBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: colorUniformBuffer
                    }
                },
            ]
        });

        const pipelineDesc: GPURenderPipelineDescriptor = {
            layout: pipelineLayout,
            vertex: vertexState,
            fragment: fragmentState,
            primitive: {
                topology: "triangle-list",
                cullMode: "none",
            },
            depthStencil: {
                format: "depth24plus-stencil8",
                depthWriteEnabled: true,
                depthCompare: "less-equal", // Very important, must be less equal otherwise it won't be able to resolve depths with same z depth value
            },
        };

        const pipeline = device.createRenderPipeline(pipelineDesc);

        return {
            pipeline,

            projectionViewBindGroup,

            instanceViewBindGroup,
            instanceStorageBuffer,

            colorBindGroup,
            colorUniformBuffer,
        }
    }

    // #endregion Public Static Methods (1)
}
