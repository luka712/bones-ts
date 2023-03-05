import { FrameworkContext } from "../../../framework/FrameworkContext";
import shaderSource from "./basic_material_shader.wgsl?raw"
import { Mat4x4 } from "../../../framework/bones_math";
import { WebGPUModel } from "../../model/WebGPUModel";
import { buffer } from "stream/consumers";
import { Camera } from "../../../framework/camera/Camera";

export class WebGPUBasicMaterialRenderPipelineWrapper
{
    private pipeline: GPURenderPipeline;

    // global uniform 
    private uniformsBuffer: GPUBuffer;
    private uniformsBindGroup: GPUBindGroup;



    // per instance data 
    private instanceDataArray = new Float32Array(1024 * (16 + 4)); // 1024 instances * mat4 + vec4 (transform, color)

    private intializeStates () : { vertexState: GPUVertexState, fragmentState: GPUFragmentState }
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

                        // // TEX COORDS
                        // {
                        //     shaderLocation: 1,
                        //     format: 'float32x2',
                        //     offset: Float32Array.BYTES_PER_ELEMENT * 3
                        // },
                        // // TINT COLOR
                        // {
                        //     shaderLocation: 2,
                        //     format: 'float32x4',
                        //     offset: Float32Array.BYTES_PER_ELEMENT * 3 + Float32Array.BYTES_PER_ELEMENT * 2
                        // }
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

    public initialize () 
    {
        const { vertexState, fragmentState } = this.intializeStates();

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
        this.uniformsBuffer = device.createBuffer({
            // projectionView, transform, diffuseColor
            size: Float32Array.BYTES_PER_ELEMENT * ( 16 + 16 + 4),
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

     
        // uniform layout. Done only once per frame, not for instance.
        this.uniformsBindGroup = device.createBindGroup({
            layout: uniformsBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.uniformsBuffer
                    },
                },]
        });


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

        this.pipeline = device.createRenderPipeline(pipelineDesc);
    }

    private writeIntoArray (from: Float32Array, to: Float32Array, index: number): void  
    {
        for (let i = 0; i < from.length; i++)
        {
            to[i + index] = from[i];
        }
    }

    public render (renderPass: GPURenderPassEncoder, camera: Camera, instances: WebGPUModel[], projectionMatrix: Mat4x4, viewMatrix: Mat4x4)
    {
        if (instances.length == 0) return;

        const device = FrameworkContext.device;

        // write into small buffer, which is just camera.
        device.queue.writeBuffer(this.uniformsBuffer, 0, camera.projectionViewMatrix);
        device.queue.writeBuffer(this.uniformsBuffer, 64, instances[0].transform, instances[0].transform.byteOffset, instances[0].transform.length);
        device.queue.writeBuffer(this.uniformsBuffer, 128, instances[0].material.color, 0, 4 );

        // let i = 0;
        // for (let instance of instances)
        // {
        //     this.writeIntoArray(instance.transform, this.instanceDataArray, i);
        //     i += instance.transform.length;
        //     this.writeIntoArray(instance.material.color, this.instanceDataArray, i);
        //     i += instance.material.color.length;
        // }

        // write into large buffer of transforms and colors
        // device.queue.writeBuffer(this.perInstanceBuffer, 0, this.instanceDataArray, 0, i * Float32Array.BYTES_PER_ELEMENT);


        renderPass.setPipeline(this.pipeline);
        renderPass.setBindGroup(0, this.uniformsBindGroup); 

        var objects_drawn: number = 0;

        //Triangles
        renderPass.setVertexBuffer(0, instances[0].mesh.vertexPositionsBuffer, 0 , instances[0].mesh.vertexPositionsBuffer.size);
        renderPass.setVertexBuffer(1, instances[0].mesh.vertexColorsBuffer, 0, instances[0].mesh.vertexColorsBuffer.size);
        // renderPass.setVertexBuffer(1, instances[0].mesh.vertexColorsBuffer);
        renderPass.setIndexBuffer(instances[0].mesh.indicesBuffer, instances[0].mesh.indexFormat);
        // renderPass.setBindGroup(1, this.triangleMaterial.bindGroup); // texture
        renderPass.drawIndexed(36, instances.length, 0, 0);
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