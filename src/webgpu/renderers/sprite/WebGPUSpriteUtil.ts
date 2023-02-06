import { WebGPUTexture2D } from '../../textures/WebGPUTexture';
import shaderSource from './spriteshader.wgsl?raw';


// pos3, tc2, color4
export const STRIDE = 3 * Float32Array.BYTES_PER_ELEMENT + 2 * Float32Array.BYTES_PER_ELEMENT + 4 * Float32Array.BYTES_PER_ELEMENT;

export interface WebGPUSpriteRendererPart 
{
    readonly pipeline: GPURenderPipeline;
    readonly cameraUniformBuffer: GPUBuffer,
    readonly cameraBindGroup: GPUBindGroup;
    readonly textureBindGroup: GPUBindGroup;
    readonly indicesBuffer: GPUBuffer;
    /**
     * Positions, texture coordinates and tint color.
     */
    readonly attributesBuffer: GPUBuffer;
    readonly attributesData: Float32Array;
}

function createBuffers (device: GPUDevice, maxInstances: number)
{
    const indices = new Uint32Array(maxInstances * 6); // 6 for quad indices
    const data = new Float32Array(maxInstances * STRIDE); // 4 for quad, pos_v3 * 4 + tex_v2 * 4 + color_v4 * 4

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
        size: (indices.byteLength + 3) & ~3,
        usage: GPUBufferUsage.INDEX,
        mappedAtCreation: true
    });
    const writeIndicesArray = new Uint32Array(indicesBuffer.getMappedRange());
    writeIndicesArray.set(indices);
    indicesBuffer.unmap();

    // POSITIONS, TEX COORDS, TINT COLORS
    const dataBuffer = device.createBuffer({
        label: "vertices",
        size: (data.byteLength + 3) & ~3,
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
        attributesData: data 
    }
}

export function createSpriteRenderPipeline (device: GPUDevice, texture: WebGPUTexture2D, maxInstances: number): WebGPUSpriteRendererPart
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
                arrayStride: STRIDE,
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

    const fragmentState: GPUFragmentState = {
        module: shaderModule,
        targets: [{
            format: 'bgra8unorm',
            blend: {
                // https://learnopengl.com/Advanced-OpenGL/Blending#:~:text=Blending%20in%20OpenGL%20is%20commonly,behind%20it%20with%20varying%20intensity.
                color: {
                    srcFactor: 'src-alpha',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add'
                },
                alpha: {
                    srcFactor: 'one',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add'
                },
            },
            writeMask: GPUColorWrite.ALL,
        }],
        entryPoint: 'fs_main'
    }

    // UNIFORMS

    // CAMERA BIND GROUP LAYOUT group(0)
    const cameraBindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                // Camera uniform group(0) binding(0)
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: {}
            },
        ],
    });

    // TEXTURE BING GROUP LAYOUT group(1)
    const textureBindGroupLayout = device.createBindGroupLayout({
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

    // TODO: TEXTURE bind group layout

    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [
            cameraBindGroupLayout,
            textureBindGroupLayout
        ]
    });

    // ONCE PER FRAME 
    const cameraUniformBuffer = device.createBuffer({
        // 2 4x4matrices
        // projection, view
        size: Float32Array.BYTES_PER_ELEMENT * 16 * 2,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // uniform layout. Done only once per frame, not for instance.
    const cameraBindGroup = device.createBindGroup({
        layout: cameraBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: cameraUniformBuffer
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

    const pipelineDesc: GPURenderPipelineDescriptor = {
        layout: pipelineLayout,
        vertex: vertexState,
        fragment: fragmentState,
        primitive: {
            topology: 'triangle-list'
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus-stencil8'

        },
    };

    const pipeline = device.createRenderPipeline(pipelineDesc);

    // create attribute buffers.
    const buffers = createBuffers(device, maxInstances);

    return {
        pipeline,
        cameraUniformBuffer,
        cameraBindGroup,
        textureBindGroup,
        indicesBuffer: buffers.indicesBuffer,
        attributesBuffer: buffers.dataBuffer,
        attributesData: buffers.attributesData
    }
}