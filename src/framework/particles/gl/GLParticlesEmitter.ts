import { TextureManager } from "../../bones_texture";
import { ComponentType, BufferUsage, GeometryBuffer, SharedVertexBufferDescription, SharedVertexBufferItemDescription, DrawType } from "../../GeometryBuffer";
import { GLGeometryBuffer } from "../../../webgl/GLGeometryBuffer";
import { Mat4x4, Vec2 } from "../../bones_math";
import { FileLoader } from "../../bones_loaders";
import { Vec3 } from "../../math/vec/Vec3";
import { InputManager } from "../../input/InputManager";
import { GLParticleEmitterRenderStepShader, GLParticleEmitterUpdateStepShader } from "./GLParticleEmitterShaders";
import { ParticlesEmitter } from "../ParticlesEmitter";
import { ParticleEmitterRenderStepShader, ParticleEmitterUpdateStepShader } from "../../shaders/particles/ParticleEmitterShader";
import { WindowManager } from "../../Window";
import { Camera2D } from "../../renderers/common/Camera2D";

// TODO: this is experimental, not finished

/**
 * The GL Particles Manager.
 * Compatible with WebGL2
 * Uses transform feedback to manage GPGPU particles.
 */
export class GLTransformFeedbackParticlesEmitter extends ParticlesEmitter 
{
    // #region Properties (4)

    // contains particles as points.
    private m_readBuffer: GeometryBuffer;
    private m_renderStepShader: ParticleEmitterRenderStepShader;
    // see https://www.khronos.org/opengl/wiki/Transform_Feedback
    private m_updateStepShader: ParticleEmitterUpdateStepShader;
    private m_writeBuffer: GeometryBuffer;

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(private m_gl: WebGL2RenderingContext,
        private m_fileLoader: FileLoader,
        private m_inputManager: InputManager,
        private m_textureManager: TextureManager)
    {
        super();
    }

    // #endregion Constructors (1)

    // #region Public Methods (3)

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

        // create update buffer
        this.m_gl.bindBuffer(this.m_gl.ARRAY_BUFFER, buffer_update);
        this.m_gl.bufferData(this.m_gl.ARRAY_BUFFER, data, BufferUsage.STREAM_DRAW);

        // create render buffer
        this.m_gl.bindBuffer(this.m_gl.ARRAY_BUFFER, buffer_render);
        this.m_gl.bufferData(this.m_gl.ARRAY_BUFFER, data, BufferUsage.STREAM_DRAW);

        // use shared buffer, describe attributes.
        const shared_buffer = new SharedVertexBufferDescription();

        const pos_desc = new SharedVertexBufferItemDescription();
        pos_desc.layoutLocation = 0;
        pos_desc.componentType = ComponentType.FLOAT;
        pos_desc.offsetInBytes = 0;
        pos_desc.vertexSize = 2;

        const vel_desc = new SharedVertexBufferItemDescription();
        vel_desc.layoutLocation = 1;
        vel_desc.componentType = ComponentType.FLOAT;
        vel_desc.offsetInBytes = 2 * 4;
        vel_desc.vertexSize = 2;

        const age_desc = new SharedVertexBufferItemDescription();
        age_desc.layoutLocation = 2;
        age_desc.componentType = ComponentType.FLOAT;
        age_desc.offsetInBytes = 4 * 4;
        age_desc.vertexSize = 1;

        const life_desc = new SharedVertexBufferItemDescription();
        life_desc.layoutLocation = 3;
        life_desc.componentType = ComponentType.FLOAT;
        life_desc.offsetInBytes = 5 * 4;
        life_desc.vertexSize = 1;

       

        shared_buffer.sharedVertexBufferItems = [pos_desc, vel_desc, age_desc, life_desc];
        shared_buffer.bufferUsage = BufferUsage.STREAM_DRAW;
        shared_buffer.numberOfPrimitives = 100_000; // fix later, n particles TODO:
        shared_buffer.drawType = DrawType.POINTS;

        // create both, for two buffers.
        shared_buffer.glBuffer = buffer_update;
        this.m_readBuffer = new GLGeometryBuffer(this.m_gl, null, null, shared_buffer);

        shared_buffer.glBuffer = buffer_render;
        this.m_writeBuffer = new GLGeometryBuffer(this.m_gl, null, null, shared_buffer);
    }

    public update (delta_time: number): void
    {
        const origin = Vec2.zero();
        var mouse_state = this.m_inputManager.getMouseState();
        origin[0] = mouse_state.position.x;
        origin[1] = mouse_state.position.y;

        const force = Vec3.zero();

        if (this.m_inputManager.getMouseState().leftButtonDown)
        {
            force[0] = (Math.random() - 0.5) * 2.0;
            force[1] = (Math.random() - 0.5) * 2.0;
        }

        this.m_updateStepShader.use();

        this.m_updateStepShader.origin = origin;
        this.m_updateStepShader.projectionViewMatrix = Camera2D.projectionViewMatrix;
        this.m_updateStepShader.update(delta_time);

        this.m_readBuffer.bind();
        this.m_readBuffer.transformFeedback(this.m_writeBuffer);
    }

    // #endregion Public Methods (3)

    // #region Private Methods (1)

    /**
     * Creates the particles data.
     * @param nOfParticles - the number of particles. By default 10000.
     * @returns 
     */
    private particlesData (nOfParticles = 100_000): Float32Array
    {
        const data = [];
        for (let i = 0; i < nOfParticles; i++)
        {
            // position
            data.push(0);
            data.push(0);

            // vel
            data.push(0.1);
            data.push(0.1);

            // age. Push big number, so that all particles are restarted at beginning.
            data.push(Math.random() * 20_000);

            // life. Max life of a particle
            data.push(Math.random() * 20_000);

        }

        return new Float32Array(data);
    }

    // #endregion Private Methods (1)
}