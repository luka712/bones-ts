import { Texture2D } from "../textures/Texture2D";
import shaderSource from "../../shaders/sprite/sprite.wgsl?raw";
import { FileLoader } from "../loaders/FileLoader";

 const FLOATS_PER_VERTEX = 9;

/**
 * The number of floats per instance of sprite.
 */
export const FLOATS_PER_INSTANCE = 4 * FLOATS_PER_VERTEX;

/**
 * The max sprites per draw.
 */
export const SPRITE_RENDERER_MAX_SPRITES_PER_DRAW = 1000;

/**
 * The sprite pipeline.
 * @note This is used by the sprite renderer to draw sprites. @see {SpriteRenderer}
 */
export class SpritePipeline {

    constructor(public readonly pipeline: GPURenderPipeline, 
        public readonly projectionViewBindGroup: GPUBindGroup, 
        public readonly textureBindGroup: GPUBindGroup) {}

    /**
     * The instance index which is used to tell how many instances are in buffer and to be drawn.
     */
    public instanceIndex: number = 0;

    /**
     * The vertex buffer draw data.
     * @note Used by vertex buffer of the sprite renderer.
     */
    public dataArray: Float32Array = new Float32Array(SPRITE_RENDERER_MAX_SPRITES_PER_DRAW * FLOATS_PER_INSTANCE);

    /**
     * Creates a sprite pipeline. 
     * @note This is used by the sprite renderer to draw sprites. @see {@link SpriteRenderer}
     * Max sprites per draw is @see {@link SPRITE_RENDERER_MAX_SPRITES_PER_DRAW}.
     * @param device The device.
     * @param texture The texture.
     * @param projectionViewBuffer The projection view buffer. 
     * @returns { SpritePipeline }
     */
    public static create (device: GPUDevice, texture: Texture2D, projectionViewBuffer: GPUBuffer): SpritePipeline {

        const loader = new FileLoader();
        const shaderModule = device.createShaderModule({
            label: "Sprite Shader Module",
            code: shaderSource,
        });

        // Bind group layout for projection view matrix
        const projectionViewBindGroupLayout = device.createBindGroupLayout({
            label: "projectionViewBindGroupLayout",
            entries: [
                {
                    // projection view matrix
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {},
                },
            ],
        });

        // Bind group layout for texture
        const textureBindGroupLayout = device.createBindGroupLayout({
            label: "Sprite Texture Bind Group Layout",
            entries: [
                {
                    // sampler
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {},
                },
                {
                    // texture
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {},
                },
            ],
        });

        // (xyz), (ts), (rgba)
        const stride = 3 * Float32Array.BYTES_PER_ELEMENT + 2 * Float32Array.BYTES_PER_ELEMENT + 4 * Float32Array.BYTES_PER_ELEMENT;
        const renderPipelineDescriptor: GPURenderPipelineDescriptor = {
            layout: device.createPipelineLayout({
                bindGroupLayouts: [
                    projectionViewBindGroupLayout,
                    textureBindGroupLayout,
                ],
            }),
            label: "Sprite Pipeline",
            vertex: {
                module: shaderModule,
                entryPoint: "vs_main",
                buffers: [
                    {
                        arrayStride: stride,
                        attributes: [
                            // POSITION
                            {
                                shaderLocation: 0,
                                format: "float32x3",
                                offset: 0,
                            },
                            // TEX COORDS
                            {
                                shaderLocation: 1,
                                format: "float32x2",
                                offset: Float32Array.BYTES_PER_ELEMENT * 3,
                            },
                            // TINT COLOR
                            {
                                shaderLocation: 2,
                                format: "float32x4",
                                offset: Float32Array.BYTES_PER_ELEMENT * 5, // 3(xyz) + 2(ts)
                            },
                        ],
                    },
                ],
            },
            fragment: {
                module: shaderModule,
                entryPoint: "fs_main",
                targets: [
                    {
                        format: "bgra8unorm",
                        blend: {
                            color: {
                                srcFactor: "one",
                                dstFactor: "one-minus-src-alpha",
                                operation: "add",
                            },
                            alpha: {
                                srcFactor: "one",
                                dstFactor: "one-minus-src-alpha",
                                operation: "add",
                            },
                        },
                    },
                ],
            },

        };

        const pipeline = device.createRenderPipeline(renderPipelineDescriptor);

        // Create bind groups
        const projectionViewBindGroup = device.createBindGroup({
            layout: projectionViewBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: projectionViewBuffer,
                    },
                },
            ],
        });

        const textureBindGroup = device.createBindGroup({
            layout: textureBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: texture.sampler,
                },
                {
                    binding: 1,
                    resource: texture.texture.createView(),
                },
            ],
        });


        return new SpritePipeline(pipeline, projectionViewBindGroup, textureBindGroup);
    }
}