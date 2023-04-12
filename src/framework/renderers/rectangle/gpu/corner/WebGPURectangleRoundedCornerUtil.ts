import { WebGPUCameraBuffer } from "../../../common/gpu/WebGPUCameraBuffer";
import { WebGPURenderPipelineUtil } from "../../../common/gpu/WebGPURenderPipelineUtil";
import shaderSource from "./rectangle_corner.wgsl?raw"

export interface WebGPURectangleRoundedCornerRendererPart 
{
    // #region Properties (6)

    readonly colorBindGroup: GPUBindGroup;
    // color
    readonly colorUniformBuffer: GPUBuffer;
    // per instance, 4 instances per draw total
    readonly instanceStorageBuffer: GPUBuffer;
    readonly instanceViewBindGroup: GPUBindGroup;
    readonly pipeline: GPURenderPipeline;
    // global
    readonly projectionViewBindGroup: GPUBindGroup;

    // #endregion Properties (6)
}

export class WebGPURectangleRoundedCornerUtil 
{
    // #region Public Static Methods (1)

    /**
     * Craates the part 
     * Consists of pipeline, buffers, color and all the data that is needed to for rendering.
     * @param device 
     */
    public static createRectangleRoundedCornerRenderPart (device: GPUDevice): WebGPURectangleRoundedCornerRendererPart
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

        const fragmentState: GPUFragmentState =WebGPURenderPipelineUtil.createFragmentState(shaderModule);

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

        // COLOR BING GROUP LAYOUT group(2)
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
                        buffer: WebGPUCameraBuffer.projectionViewUniformBuffer
                    },
                },]
        });

        // for 4 instances per draw
        const instanceStorageBuffer = device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * 4 * 4,
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

        const pipelineDesc: GPURenderPipelineDescriptor = 
            WebGPURenderPipelineUtil.createPipelineDescriptor(pipelineLayout, vertexState, fragmentState, "triangle-list", "back");

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
