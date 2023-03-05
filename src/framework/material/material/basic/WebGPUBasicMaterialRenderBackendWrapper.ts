import { WebGPUModel } from "../../../../webgpu/model/WebGPUModel";
import { WebGPURenderer } from "../../../../webgpu/WebGPURenderer";
import { Mat4x4 } from "../../../bones_math";
import { Camera } from "../../../camera/Camera";
import { Framework } from "../../../Framework";
import { FrameworkContext } from "../../../FrameworkContext";
import { Mesh } from "../../../mesh/Mesh";
import { WebGPUMesh } from "../../../mesh/WebGPUMesh";
import { Material } from "../../Material";
import { RenderBackendWrapper } from "../../RenderBackendWrapper";
import shaderSource from "./basic_material_shader.wgsl?raw"

/**
 * Holds the GPURenderPipeline and informatio about uniforms buffer and bind groups necessary for drawing the BasicMaterial.
 */
export class WebGPUBasicMaterialRenderBackendWrapper implements RenderBackendWrapper 
{
    private m_pipeline: GPURenderPipeline;

    // global uniform 
    private m_uniformsBuffer: GPUBuffer;
    private m_uniformsBindGroup: GPUBindGroup;

    constructor(private m_framework: Framework)
    {
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

        return {
            vertexState, fragmentState
        }
    }

    private initializeBuffers () : { uniformsBindGroupLayout: GPUBindGroupLayout }
    {
        const device = FrameworkContext.device;

        // UNIFORMS

        // GLOBAL UNIFORM BIND GROUP LAYOUT group(0)
        const uniformsBindGroupLayout = device.createBindGroupLayout({
            label: "ubo",
            entries: [
                {
                    // global uniform group(0) binding(0)
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },

            ],
        });


        // ONCE PER FRAME 
        this.m_uniformsBuffer = device.createBuffer({
            // projectionView, transform, diffuseColor
            size: Float32Array.BYTES_PER_ELEMENT * (16 + 16 + 4),
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });


        // uniform layout. Done only once per frame, not for instance.
        this.m_uniformsBindGroup = device.createBindGroup({
            layout: uniformsBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.m_uniformsBuffer
                    },
                },]
        });

        return { uniformsBindGroupLayout };
    }

    /**
     * Initialize the backend wrapper.
     * Creates the render pipeline and all the uniform buffers.
     */
    public initialize () : void 
    {
        const { vertexState, fragmentState } = this.intializeStates();
        const { uniformsBindGroupLayout } = this.initializeBuffers();

        const device = FrameworkContext.device;


        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [
                uniformsBindGroupLayout
            ]
        });

        const pipelineDesc: GPURenderPipelineDescriptor = {
            label: "basicMaterial",
            layout: pipelineLayout,
            vertex: vertexState,
            fragment: fragmentState,
            primitive: {
                topology: "triangle-list",
                cullMode: "back"
            },
            depthStencil: {
                format: "depth24plus-stencil8",
                depthWriteEnabled: true,
                depthCompare: "less-equal", // Very important, must be less equal otherwise it won't be able to resolve depths with same z depth value
            },
        };

        this.m_pipeline = device.createRenderPipeline(pipelineDesc);
    }

    public render(camera: Camera, mesh: Mesh, material: Material) : void 
    {
        // get necessary information.
        const device = (this.m_framework.renderer as WebGPURenderer).device;
        const renderPassEncoder = (this.m_framework.renderer as WebGPURenderer).currentRenderPassEncoder;
        const webgpuMesh = mesh.internalMesh;

        // write into small buffer, which is just camera.
        device.queue.writeBuffer(this.m_uniformsBuffer, 0, camera.projectionViewMatrix, 0, 16);
        device.queue.writeBuffer(this.m_uniformsBuffer, 64, mesh.transform, 0, 16);
        device.queue.writeBuffer(this.m_uniformsBuffer, 128, material.diffuseColor, 0, 4);

        renderPassEncoder.setPipeline(this.m_pipeline);
        renderPassEncoder.setBindGroup(0, this.m_uniformsBindGroup);

        //Triangles
        renderPassEncoder.setVertexBuffer(0, webgpuMesh.vertexPositionsBuffer, 0, webgpuMesh.vertexPositionsBuffer.size);
        renderPassEncoder.setVertexBuffer(1, webgpuMesh.vertexColorsBuffer, 0, webgpuMesh.vertexColorsBuffer.size);
        // renderPass.setVertexBuffer(1, instances[0].mesh.vertexColorsBuffer);
        renderPassEncoder.setIndexBuffer(webgpuMesh.indicesBuffer, webgpuMesh.indexFormat);
        // renderPass.setBindGroup(1, this.triangleMaterial.bindGroup); // texture
        // draw 1 item. 
        renderPassEncoder.drawIndexed(mesh.indicesCount, 1, 0, 0);
    }

    public renderInner (renderPass: GPURenderPassEncoder, camera: Camera, instances: WebGPUModel[], projectionMatrix: Mat4x4, viewMatrix: Mat4x4)
    {
        // if (instances.length == 0) return;

        // const device = FrameworkContext.device;

        // // write into small buffer, which is just camera.
        // device.queue.writeBuffer(this.uniformsBuffer, 0, camera.projectionViewMatrix);
        // device.queue.writeBuffer(this.uniformsBuffer, 64, instances[0].transform, instances[0].transform.byteOffset, instances[0].transform.length);
        // device.queue.writeBuffer(this.uniformsBuffer, 128, instances[0].material.color, 0, 4);

        // renderPass.setPipeline(this.pipeline);
        // renderPass.setBindGroup(0, this.uniformsBindGroup);

        // //Triangles
        // renderPass.setVertexBuffer(0, instances[0].mesh.vertexPositionsBuffer, 0, instances[0].mesh.vertexPositionsBuffer.size);
        // renderPass.setVertexBuffer(1, instances[0].mesh.vertexColorsBuffer, 0, instances[0].mesh.vertexColorsBuffer.size);
        // // renderPass.setVertexBuffer(1, instances[0].mesh.vertexColorsBuffer);
        // renderPass.setIndexBuffer(instances[0].mesh.indicesBuffer, instances[0].mesh.indexFormat);
        // // renderPass.setBindGroup(1, this.triangleMaterial.bindGroup); // texture
        // renderPass.drawIndexed(mesh.indicesCount, instances.length, 0, 0);
        // objects_drawn += renderables.object_counts[object_types.TRIANGLE];

        // quads
        // renderpass.setVertexBuffer(0, this.quadMesh.buffer);
        // renderpass.setBindGroup(1, this.quadMaterial.bindGroup);
        // renderpass.draw(
        //     6, renderables.object_counts[object_types.QUAD],
        //     0, objects_drawn
        // );
        // objects_drawn += renderables.object_counts[object_types.QUAD];

        //Statue
        // renderpass.setVertexBuffer(0, this.statueMesh.buffer);
        // renderpass.setBindGroup(1, this.triangleMaterial.bindGroup);
        // renderpass.draw(
        //     this.statueMesh.vertexCount, 1,
        //     0, objects_drawn
        // );
        // objects_drawn += 1;

    }

}