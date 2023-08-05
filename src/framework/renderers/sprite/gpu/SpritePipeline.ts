
import { WebGPUTexture2D } from '../../../../webgpu/textures/WebGPUTexture';
import { BlendMode } from '../../../SpriteRenderer';
import { WebGPUCameraBuffer } from '../../common/gpu/WebGPUCameraBuffer';
import { WebGPURenderPipelineUtil } from '../../common/gpu/WebGPURenderPipelineUtil';
import { SpriptePipelineConstants } from './SpritePipelineConstants';
import shaderSource from './spriteshader.wgsl?raw';


// pos3, tc2, col4
export const GPU_SPRITE_RENDERER_ATTRIBUTES_STRIDE = 3 * Float32Array.BYTES_PER_ELEMENT + 2 * Float32Array.BYTES_PER_ELEMENT + 4 * Float32Array.BYTES_PER_ELEMENT;

export class SpritePipeline {
    readonly pipeline: GPURenderPipeline;

    // global
    readonly globalBindGroup: GPUBindGroup;

    // texture
    readonly textureBindGroup: GPUBindGroup;


    readonly dataArray: Float32Array;


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

 
    public static create (device: GPUDevice, texture: WebGPUTexture2D, blendMode: BlendMode): SpritePipeline {

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

        return {
            pipeline,

            dataArray: new Float32Array(SpriptePipelineConstants.MAX_INSTANCES * SpriptePipelineConstants.FLOATS_PER_INSTANCE),

            globalBindGroup,

            texture,
            textureBindGroup,

            instanceIndex: 0,

            blendMode: blendMode
        }
    }
}

