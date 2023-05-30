
import { WebGPUTexture2D } from '../../../../webgpu/textures/WebGPUTexture';
import { BlendMode } from '../../../SpriteRenderer';
import { WebGPUCameraBuffer } from '../../common/gpu/WebGPUCameraBuffer';
import { WebGPURenderPipelineUtil } from '../../common/gpu/WebGPURenderPipelineUtil';
import shaderSource from './spriteshader.wgsl?raw';


// pos3, tc2, col4
export const GPU_SPRITE_RENDERER_ATTRIBUTES_STRIDE = 3 * Float32Array.BYTES_PER_ELEMENT + 2 * Float32Array.BYTES_PER_ELEMENT + 4 * Float32Array.BYTES_PER_ELEMENT;

export interface WebGPUSpriteRendererPart 
{
    readonly pipeline: GPURenderPipeline;

    // global
    readonly globalBindGroup: GPUBindGroup;

    // texture
    readonly textureBindGroup: GPUBindGroup;

    readonly indicesBuffer: GPUBuffer;

    /**
     * Positions, texture coordinates and tint color.
     */
    readonly attributesBuffer: GPUBuffer;
    readonly attributesData: Float32Array;


    // MUTABLE DATA, WHICH IS CHANGED FOR EACH INSTANCE OF SPRITE
    /**
     * The our texture definition. Hold it here, and render when end is called.
     */
    texture?: WebGPUTexture2D;
    /**
     * The index of number of instances to draw.
     */
    instanceIndex: number;

    /**
     * Type of blending being used.
     */
    blendMode: BlendMode
}

export class WebGPUSpriteUtil 
{
    /**
     * Creates the vertex buffer and index buffer.
     * Data per vertex!!!
     */
    private static createBuffers (device: GPUDevice, maxInstances: number)
    {
        // TODO: indices buffer can be same instance.

        const indices = new Uint32Array(maxInstances * 6); // 6 for quad indices
        const instanceData = new Float32Array(maxInstances * 4); // for now holds only vec4 for tint color
        const data = new Float32Array(maxInstances * GPU_SPRITE_RENDERER_ATTRIBUTES_STRIDE);

        // index of indice
        let index = 0;
        for (let i = 0; i < maxInstances * 6; i += 6)
        {
            // Should be something like
            // 0, 1, 2, first triangle (bottom left - top left - top right)
            // 0, 2, 3  second triangle (bottom left - top right - bottom right))

            // first triangle
            indices[i] = index;
            indices[i + 1] = index + 1;
            indices[i + 2] = index + 2;

            // second triangle
            indices[i + 3] = index;
            indices[i + 4] = index + 2;
            indices[i + 5] = index + 3;

            index += 4;
        }

        // INDICES
        const indicesBuffer = device.createBuffer({
            label: "indexBuffer",
            size: (indices.byteLength + 63) & ~63,
            usage: GPUBufferUsage.INDEX,
            mappedAtCreation: true
        });
        const writeIndicesArray = new Uint32Array(indicesBuffer.getMappedRange());
        writeIndicesArray.set(indices);
        indicesBuffer.unmap();

        // POSITIONS, TEX COORDS, TINT COLORS
        const dataBuffer = device.createBuffer({
            label: "vertexBuffer",
            size: (data.byteLength + 63) & ~63,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, // COPY_DST as it is written to frequently
            mappedAtCreation: true,
        });

        // write data to buffer.
        const writeDatArray = new Float32Array(dataBuffer.getMappedRange());
        writeDatArray.set(data);
        dataBuffer.unmap();

        return {
            indicesBuffer,
            dataBuffer,
            attributesData: data,
            instanceData
        }
    }

    /**
     * Craates the part 
     * Consists of pipeline, buffers, texture and all the data that is needed to for rendering.
     * @param device 
     * @param texture 
     * @param maxInstances - what is number of instances that can be rendererd per part? 
     */
    public static createSpriteRenderPart (device: GPUDevice, texture: WebGPUTexture2D, maxInstances: number, blendMode: BlendMode): WebGPUSpriteRendererPart
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
                    arrayStride: GPU_SPRITE_RENDERER_ATTRIBUTES_STRIDE,
                    attributes: [
                        // POSITION
                        {
                            shaderLocation: 0,
                            format: 'float32x3',
                            offset: 0
                        },
                        // TEX COORDS
                        {
                            shaderLocation: 1,
                            format: 'float32x2',
                            offset: Float32Array.BYTES_PER_ELEMENT * 3
                        },
                        // TINT COLOR
                        {
                            shaderLocation: 2,
                            format: 'float32x4',
                            offset: Float32Array.BYTES_PER_ELEMENT * 3 + Float32Array.BYTES_PER_ELEMENT * 2
                        }
                    ],
                    stepMode: 'vertex'
                }
            ]
        };

        const fragmentState: GPUFragmentState = WebGPURenderPipelineUtil.createFragmentState(shaderModule, 'fs_main', blendMode);
        
        // UNIFORMS

        // GLOBAL UNIFORM BIND GROUP LAYOUT group(0)
        const globalUniformsBindGroupLayout = device.createBindGroupLayout({
            label: "globalUniforms(projectionView)",
            entries: [
                {
                    // global uniform group(0) binding(0)
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
            ],
        });


        // TEXTURE BING GROUP LAYOUT group(1)
        const textureBindGroupLayout = device.createBindGroupLayout({
            label: "textureLayout",
            entries: [
                {
                    // sampler group(1) binding(0)
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                },
                {
                    // texture group(1) binding(1)
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                }
            ]
        })

        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [
                globalUniformsBindGroupLayout,
                textureBindGroupLayout
            ]
        });

        // uniform layout. Done only once per frame, not for instance.
        const globalBindGroup = device.createBindGroup({
            layout: globalUniformsBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: WebGPUCameraBuffer.projectionViewUniformBuffer
                    },
                },]
        });


        // Create texture bind groupd and use it
        const textureBindGroup = device.createBindGroup({
            layout: textureBindGroupLayout,
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

        const pipelineDesc: GPURenderPipelineDescriptor 
            = WebGPURenderPipelineUtil.createPipelineDescriptor(pipelineLayout, vertexState, fragmentState, "triangle-list", "back");

        const pipeline = device.createRenderPipeline(pipelineDesc);

        // create attribute buffers.
        const buffers = this.createBuffers(device, maxInstances);

        return {
            pipeline,

            attributesBuffer: buffers.dataBuffer,
            attributesData: buffers.attributesData,

            globalBindGroup,

            texture,
            textureBindGroup,
            indicesBuffer: buffers.indicesBuffer,

            instanceIndex: 0,

            blendMode: blendMode
        }
    }
}
