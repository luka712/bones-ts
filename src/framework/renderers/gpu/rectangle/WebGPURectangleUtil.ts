import shaderSource from "../../../shader_source/gpu/basic_color.wgsl?raw"
import { WebGPUCameraBuffer } from "../../common/WebGPUCameraBuffer";


// pos3, tc2, col4
export const GPU_SPRITE_RENDERER_ATTRIBUTES_STRIDE = 3 * Float32Array.BYTES_PER_ELEMENT + 2 * Float32Array.BYTES_PER_ELEMENT + 4 * Float32Array.BYTES_PER_ELEMENT;

export interface WebGPURectangleRendererPart 
{
    readonly pipeline: GPURenderPipeline;

    // global
    readonly projectionViewBindGroup: GPUBindGroup;

    // color
    readonly colorUniformBuffer: GPUBuffer;
    readonly colorBindGroup: GPUBindGroup;

    readonly indicesBuffer: GPUBuffer;

    /**
     * Positions buffer.
     */
    readonly attributesBuffer: GPUBuffer;
    readonly attributesData: Float32Array;
}

export class WebGPURectangleUtil 
{
    private static m_indicesBuffer?: GPUBuffer;

    /**
     * Gets indicies buffer or creates a new one.
     * @param device - the gpu device
     * @returns - gpu buffer
     */
    private static getOrCreateIndicesBuffer (device: GPUDevice): GPUBuffer
    {
        if (!this.m_indicesBuffer)
        {
            const indices = new Uint16Array(30);
            // for 5 rects.
            // index
            let i_index = 0;
            for (let i = 0; i < 30; i += 6)
            {
                indices[i] = i_index;
                indices[i + 1] = i_index + 1;
                indices[i + 2] = i_index + 2;

                // second triangle
                indices[i + 3] = i_index;
                indices[i + 4] = i_index + 2;
                indices[i + 5] = i_index + 3;

                i_index += 4;
            }

            this.m_indicesBuffer = device.createBuffer({
                label: "rectangle index buffer",
                size: (indices.byteLength + 3) & ~3,
                usage: GPUBufferUsage.INDEX,
                mappedAtCreation: true
            });
            const writeIndicesArray = new Uint16Array(this.m_indicesBuffer.getMappedRange());
            writeIndicesArray.set(indices);
            this.m_indicesBuffer.unmap();
        }

        return this.m_indicesBuffer;
    }

    /**
     * Creates the buffer for attributes. In this case only position. Also creates data array for it.
     * @param device 
     * @returns
     */
    private static createAttributesBuffer (device: GPUDevice): { attributesBuffer: GPUBuffer, attributesData: Float32Array }
    {
        // Position buffer.
        // 4 for each corner, 2 for position 2, 5 number of instances
        const attributesData = new Float32Array(4 * 2 * 5);

        // POSITIONS, TEX COORDS, TINT COLORS
        const attributesBuffer = device.createBuffer({
            label: "vertexBuffer",
            size: (attributesData.byteLength + 3) & ~3,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, // COPY_DST as it is written to frequently
            mappedAtCreation: true,
        });

        // write data to buffer.
        const writeDatArray = new Float32Array(attributesBuffer.getMappedRange());
        writeDatArray.set(attributesData);
        attributesBuffer.unmap();

        return {
            attributesBuffer,
            attributesData
        }
    }

    /**
     * Creates the vertex buffer and index buffer.
     * Data per vertex!!!
     */
    private static createBuffers (device: GPUDevice)
    {
        const attrBuffer = this.createAttributesBuffer(device);
        const indicesBuffer = this.getOrCreateIndicesBuffer(device);

        return {
            indicesBuffer,
            attributesBuffer: attrBuffer.attributesBuffer,
            attributesData: attrBuffer.attributesData
        }
    }

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


        // COLOR BING GROUP LAYOUT group(1)
        const colorBindGroupLayout = device.createBindGroupLayout({
            label: "colorLayout",
            entries: [
                {
                    // global uniform group(1) binding(0)
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
                cullMode: "front",
            },
            depthStencil: {
                format: "depth24plus-stencil8",
                depthWriteEnabled: true,
                depthCompare: "less-equal", // Very important, must be less equal otherwise it won't be able to resolve depths with same z depth value
            },
        };

        const pipeline = device.createRenderPipeline(pipelineDesc);

        // create attribute buffers.
        const buffers = this.createBuffers(device);

        return {
            pipeline,

            attributesBuffer: buffers.attributesBuffer,
            attributesData: buffers.attributesData,

            projectionViewBindGroup,

            colorBindGroup,
            colorUniformBuffer,
            indicesBuffer: buffers.indicesBuffer,
        }
    }
}
