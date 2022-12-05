import { TextureManager } from "../../framework/bones_texture";
import { ComponentType, BufferUsage, GeometryBuffer, SharedVertexBufferDescription, SharedVertexBufferItemDescription, DrawType } from "../../framework/GeometryBuffer";
import { GLGeometryBuffer } from "../GLGeometryBuffer";
import { Mat4x4 } from "../../framework/bones_math";
import { FileLoader } from "../../framework/bones_loaders";
import { Vec3 } from "../../framework/math/vec/Vec3";
import { InputManager } from "../../framework/input/InputManager";
import { GLParticleEmitterRenderStepShader, GLParticleEmitterUpdateStepShader } from "../shaders/particles/GLParticleEmitterShaders";
import { ParticlesEmitter } from "../../framework/particles/ParticlesEmitter";
import { ParticleEmitterRenderStepShader, ParticleEmitterUpdateStepShader } from "../../framework/shaders/particles/ParticleEmitterShader";
import { WindowManager } from "../../framework/Window";

// TODO: this is experimental, not finished

/**
 * The GL Particles Manager.
 * Compatible with WebGL2
 * Uses transform feedback to manage GPGPU particles.
 */
export class GLTransformFeedbackParticlesEmitter extends ParticlesEmitter 
{
    // see https://www.khronos.org/opengl/wiki/Transform_Feedback

    private m_updateStepShader: ParticleEmitterUpdateStepShader;
    private m_renderStepShader: ParticleEmitterRenderStepShader;

    // contains particles as points.
    private m_readBuffer: GeometryBuffer;
    private m_writeBuffer: GeometryBuffer;

    constructor(private m_gl: WebGL2RenderingContext,
        private m_fileLoader: FileLoader,
        private m_inputManager: InputManager,
        private m_textureManager: TextureManager,
        private m_window: WindowManager)
    {
        super();
    }

    private particlesData (): Float32Array
    {
        const n_particles = 100000;

        const data = [];
        for (let i = 0; i < n_particles; i++)
        {
            // position
            data.push(0);
            data.push(0);
            data.push(0);

            // vel
            data.push(0);
            data.push(0);
            data.push(0);

            // acc
            data.push(0);
            data.push(0);
            data.push(0);

            // age. Push big number, so that all particles are restarted at beginning.
            data.push(Math.random() * 10000);

            // debug 
            data.push(0);
            data.push(0);
            data.push(0);
            data.push(0);
        }

        return new Float32Array(data);
    }


    /**
     * Initialize the GPU particle emitter.
     */
    public async initialize (): Promise<void>
    {
        // SHADERS
        this.m_updateStepShader = new GLParticleEmitterUpdateStepShader(this.m_gl, this.m_fileLoader, this.m_textureManager);
        this.m_renderStepShader = new GLParticleEmitterRenderStepShader(this.m_gl, this.m_fileLoader);

        await this.m_updateStepShader.initialize();
        await this.m_renderStepShader.initialize();

        // BUFFERS 

        // transforms has two pass, update and render.
        // create buffers and fill them
        const buffer_update = this.m_gl.createBuffer();
        const buffer_render = this.m_gl.createBuffer();

        const data = this.particlesData();

        this.m_gl.bindBuffer(this.m_gl.ARRAY_BUFFER, buffer_update);
        this.m_gl.bufferData(this.m_gl.ARRAY_BUFFER, data, BufferUsage.STREAM_DRAW);

        this.m_gl.bindBuffer(this.m_gl.ARRAY_BUFFER, buffer_render);
        this.m_gl.bufferData(this.m_gl.ARRAY_BUFFER, data, BufferUsage.STREAM_DRAW);

        // use shared buffer, describe attributes.
        const shared_buffer = new SharedVertexBufferDescription();

        const pos_desc = new SharedVertexBufferItemDescription();
        pos_desc.layoutLocation = 0;
        pos_desc.componentType = ComponentType.FLOAT;
        pos_desc.offsetInBytes = 0;
        pos_desc.vertexSize = 3;

        const vel_desc = new SharedVertexBufferItemDescription();
        vel_desc.layoutLocation = 1;
        vel_desc.componentType = ComponentType.FLOAT;
        vel_desc.offsetInBytes = 3 * 4;
        vel_desc.vertexSize = 3;

        const acc_desc = new SharedVertexBufferItemDescription();
        acc_desc.layoutLocation = 2;
        acc_desc.componentType = ComponentType.FLOAT;
        acc_desc.offsetInBytes = 6 * 4;
        acc_desc.vertexSize = 3;

        const age_desc = new SharedVertexBufferItemDescription();
        age_desc.layoutLocation = 3;
        age_desc.componentType = ComponentType.FLOAT;
        age_desc.offsetInBytes = 9 * 4;
        age_desc.vertexSize = 1;

        const debug_desc = new SharedVertexBufferItemDescription();
        debug_desc.layoutLocation = 4;
        debug_desc.componentType = ComponentType.FLOAT;
        debug_desc.offsetInBytes = 10 * 4;
        debug_desc.vertexSize = 4;

        shared_buffer.sharedVertexBufferItems = [pos_desc, vel_desc, acc_desc, age_desc, debug_desc];
        shared_buffer.bufferUsage = BufferUsage.STREAM_DRAW;
        shared_buffer.numberOfPrimitives = 100000; // fix later, n particles TODO:
        shared_buffer.drawType = DrawType.POINTS;

        // create both, for two buffers.
        shared_buffer.glBuffer = buffer_update;
        this.m_readBuffer = new GLGeometryBuffer(this.m_gl, null, null, shared_buffer);

        shared_buffer.glBuffer = buffer_render;
        this.m_writeBuffer = new GLGeometryBuffer(this.m_gl, null, null, shared_buffer);
    }

    public update (delta_time: number): void
    {
        const origin = Vec3.zero();
        var mouse_state = this.m_inputManager.getMouseState();
        origin[0] = mouse_state.position.x;
        origin[1] = mouse_state.position.y;

        const force = Vec3.zero();

        if (this.m_inputManager.getMouseState().leftButtonDown)
        {
            force[0] = (Math.random() - 0.5) * 1.0;
            force[1] = (Math.random() - 0.5) * 1.0;
        }

        const projectionMatrix = Mat4x4.orthographic(0, this.m_window.width, this.m_window.height, 0, -1, 1);
        const viewMatrix = Mat4x4.lookAt(Vec3.zero(), Vec3.negativeUnitZ(), Vec3.unitY());

        this.m_updateStepShader.use();

        this.m_updateStepShader.origin = origin;
        this.m_updateStepShader.force = force;
        this.m_updateStepShader.projectionMatrix = projectionMatrix;
        this.m_updateStepShader.viewMatrix = viewMatrix;
        this.m_updateStepShader.update(delta_time);

        this.m_readBuffer.bind();
        this.m_readBuffer.transformFeedback(this.m_writeBuffer);

    }

    public draw (): void
    {
        this.m_gl.enable(this.m_gl.BLEND);
        this.m_gl.blendFunc(this.m_gl.SRC_ALPHA, this.m_gl.ONE_MINUS_SRC_ALPHA);

        this.m_renderStepShader.use();

        this.m_readBuffer.bind();
        this.m_readBuffer.draw();



        // swap buffers
        const temp = this.m_readBuffer;
        this.m_readBuffer = this.m_writeBuffer;
        this.m_writeBuffer = temp;

    }

}