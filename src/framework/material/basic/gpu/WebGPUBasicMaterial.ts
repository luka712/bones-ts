

import shaderSource from "./basic_material_shader.wgsl?raw"
import { BasicMaterial } from "../BasicMaterial";
import { WebGPURenderer } from "../../../../webgpu/WebGPURenderer";
import { Camera } from "../../../camera/Camera";
import { Framework } from "../../../Framework";
import { FrameworkContext } from "../../../FrameworkContext";
import { WebGPUMesh } from "../../../mesh/gpu/WebGPUMesh";
import { Mat4x4 } from "../../../bones_math";
import { Material } from "../../Material";
import { WebGPURenderPipelineUtil } from "../../../renderers/common/gpu/WebGPURenderPipelineUtil";

/**
 * Holds the GPURenderPipeline and informatio about uniforms buffer and bind groups necessary for drawing the BasicMaterial.
 */
export class WebGPUBasicMaterial extends BasicMaterial 
{
    private m_pipeline: GPURenderPipeline;
    private m_uniformsBindGroup: GPUBindGroup;

    /**
     * For global (projectionViewMatrix)
     */
    private m_uniformGlobalBuffer: GPUBuffer;
    /**
     * For drawing instance(transformMatrix, diffuseColor)
     */
    private m_uniformInstancesBuffer: GPUBuffer;


    constructor(private m_framework: Framework, maxInstances = 1)
    {
        super(maxInstances);
    }

    private intializeStates (): { vertexState: GPUVertexState, fragmentState: GPUFragmentState }
    {
        const device = FrameworkContext.device;

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
                    arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
                    attributes: [
                        // POSITION
                        {
                            shaderLocation: 0,
                            format: 'float32x3',
                            offset: 0
                        },
                    ],
                    stepMode: 'vertex'
                },
                {
                    arrayStride: Float32Array.BYTES_PER_ELEMENT * 4,
                    attributes: [
                        // VERTEX COLOR 
                        {
                            shaderLocation: 1,
                            format: 'float32x4',
                            offset: 0
                        },
                    ],
                    stepMode: 'vertex'
                },

            ]
        };

        const fragmentState: GPUFragmentState = WebGPURenderPipelineUtil.createFragmentState(shaderModule);

        return {
            vertexState, fragmentState
        }
    }

    private initializeBuffers (): { uniformsBindGroupLayout: GPUBindGroupLayout }
    {
        const device = FrameworkContext.device;

        // UNIFORMS

        // GLOBAL UNIFORM BIND GROUP LAYOUT group(0)
        const uniformsBindGroupLayout = device.createBindGroupLayout({
            label: "basic_material_layout",
            entries: [
                {
                    // global uniform group(0) binding(0)
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    // instance uniform group(0) binding(1)
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                }

            ],
        });


        // ONCE PER FRAME 
        this.m_uniformGlobalBuffer = device.createBuffer({
            // projectionView, diffuseColor
            size: Float32Array.BYTES_PER_ELEMENT * (16 + 4),
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.m_uniformInstancesBuffer = device.createBuffer({
            // transform
            size: Float32Array.BYTES_PER_ELEMENT * 16 * this.maxInstances,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });

        // uniform layout. Done only once per frame, not for instance.
        this.m_uniformsBindGroup = device.createBindGroup({
            layout: uniformsBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.m_uniformGlobalBuffer
                    },
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.m_uniformInstancesBuffer
                    }
                }]
        });

        return { uniformsBindGroupLayout };
    }

    /**
     * Initialize the backend wrapper.
     * Creates the render pipeline and all the uniform buffers.
     */
    public initialize (): void 
    {
        const { vertexState, fragmentState } = this.intializeStates();
        const { uniformsBindGroupLayout } = this.initializeBuffers();

        const device = FrameworkContext.device;


        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [
                uniformsBindGroupLayout
            ]
        });

        const pipelineDesc: GPURenderPipelineDescriptor
             = WebGPURenderPipelineUtil.createPipelineDescriptor(pipelineLayout, vertexState, fragmentState, "triangle-list" , "back");

        this.m_pipeline = device.createRenderPipeline(pipelineDesc);
    }

    /**
     * @inheritdoc
     */
    public draw (camera: Camera, mesh: WebGPUMesh): void 
    {
        // get necessary information.
        const device = (this.m_framework.renderer as WebGPURenderer).device;
        const renderPassEncoder = (this.m_framework.renderer as WebGPURenderer).currentRenderPassEncoder;

        // write into small buffer, which is just camera.
        device.queue.writeBuffer(this.m_uniformGlobalBuffer, 0, camera.projectionViewMatrix, 0, 16);
        device.queue.writeBuffer(this.m_uniformGlobalBuffer, 64, this.diffuseColor, 0, 4);

        // instance data
        device.queue.writeBuffer(this.m_uniformInstancesBuffer, 0, mesh.transform, 0, 16);

        renderPassEncoder.setPipeline(this.m_pipeline);
        renderPassEncoder.setBindGroup(0, this.m_uniformsBindGroup);

        // Triangles
        renderPassEncoder.setVertexBuffer(0, mesh.vertexPositionsBuffer, 0, mesh.vertexPositionsBuffer.size);
        renderPassEncoder.setVertexBuffer(1, mesh.vertexColorsBuffer, 0, mesh.vertexColorsBuffer.size);
        renderPassEncoder.setIndexBuffer(mesh.indicesBuffer, mesh.indexFormat);
        renderPassEncoder.drawIndexed(mesh.indicesCount, 1, 0, 0);
    }

    /**
     * @inheritdoc
     */
    public drawInstanced (camera: Camera, mesh: WebGPUMesh, transforms: Mat4x4[]): void 
    {
        if (transforms.length == 0) return;

        const array = Mat4x4.matricesArrayToSignedArray(transforms);
        this.drawInstancedPrefilled(camera, mesh, array, transforms.length);
    }

    /**
     * @inheritdoc
     */
    public drawInstancedPrefilled (camera: Camera, mesh: WebGPUMesh, flatTransformsArray: Float32Array, nOfInstances: number): void
    {
        // get necessary information.
        const device = (this.m_framework.renderer as WebGPURenderer).device;
        const renderPassEncoder = (this.m_framework.renderer as WebGPURenderer).currentRenderPassEncoder;

        // write into small buffer, which is just camera.
        device.queue.writeBuffer(this.m_uniformGlobalBuffer, 0, camera.projectionViewMatrix, 0, 16);
        device.queue.writeBuffer(this.m_uniformGlobalBuffer, 64, this.diffuseColor, 0, 4);
        device.queue.writeBuffer(this.m_uniformInstancesBuffer, 0, flatTransformsArray, 0, 16 * nOfInstances);

        renderPassEncoder.setPipeline(this.m_pipeline);
        renderPassEncoder.setBindGroup(0, this.m_uniformsBindGroup);

        // Triangles
        renderPassEncoder.setVertexBuffer(0, mesh.vertexPositionsBuffer, 0, mesh.vertexPositionsBuffer.size);
        renderPassEncoder.setVertexBuffer(1, mesh.vertexColorsBuffer, 0, mesh.vertexColorsBuffer.size);
        renderPassEncoder.setIndexBuffer(mesh.indicesBuffer, mesh.indexFormat);

        renderPassEncoder.drawIndexed(mesh.indicesCount, nOfInstances , 0, 0);
    }

    /**
     * @inheritdoc
     */
    public copy (): Material
    {
        const material = new WebGPUBasicMaterial(this.m_framework, this.maxInstances);
        material.diffuseColor = this.diffuseColor;
        material.initialize();
        return material;
    }

}