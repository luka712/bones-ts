import { TextureManager } from "../../bones_texture";
import { ComponentType, BufferUsage, GeometryBuffer, SharedVertexBufferDescription, SharedVertexBufferItemDescription, DrawType, VertexBufferDescription } from "../../GeometryBuffer";
import { GLGeometryBuffer } from "../../geometry/gl/GLGeometryBuffer";
import { Mat4x4, Vec2 } from "../../bones_math";
import { FileLoader } from "../../bones_loaders";
import { Vec3 } from "../../math/vec/Vec3";
import { InputManager } from "../../input/InputManager";
import { GLParticleEmitterRenderStepShader, GLParticleEmitterUpdateStepShader } from "./GLParticleEmitterShaders";
import { ParticleEmitterOptions, ParticlesEmitter } from "../ParticlesEmitter";
import { ParticleEmitterRenderStepShader, ParticleEmitterUpdateStepShader } from "../../shaders/particles/ParticleEmitterShader";
import { WindowManager } from "../../Window";
import { Camera2D } from "../../renderers/common/Camera2D";
import { Framework } from "../../Framework";
import { verify } from "crypto";

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
        private readonly m_framework: Framework,
        options: ParticleEmitterOptions = {
            nOfParticles: 10_0
        })
    {
        super(options);
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
        this.m_updateStepShader = new GLParticleEmitterUpdateStepShader(this.m_gl, this.m_framework);
        this.m_renderStepShader = new GLParticleEmitterRenderStepShader(this.m_gl, this.m_framework);

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

        // vertex buffer, shared between each particle
        const vertexBuffer = new VertexBufferDescription();
        vertexBuffer.layoutLocation = 0;
        vertexBuffer.divisor = 1;
        vertexBuffer.componentType = ComponentType.FLOAT;
        vertexBuffer.vertexSize = 1;
        vertexBuffer.bufferUsage = BufferUsage.STATIC_DRAW;
        vertexBuffer.data = new Float32Array([1]);

        // use shared buffer, describe attributes.
        const shared_buffer = new SharedVertexBufferDescription();

        const pos_desc = new SharedVertexBufferItemDescription();
        pos_desc.layoutLocation = 1;
        pos_desc.componentType = ComponentType.FLOAT;
        pos_desc.offsetInBytes = 0;
        pos_desc.vertexSize = 2;

        const vel_desc = new SharedVertexBufferItemDescription();
        vel_desc.layoutLocation = 2;
        vel_desc.componentType = ComponentType.FLOAT;
        vel_desc.offsetInBytes = 2 * 4;
        vel_desc.vertexSize = 2;

        const age_desc = new SharedVertexBufferItemDescription();
        age_desc.layoutLocation = 3;
        age_desc.componentType = ComponentType.FLOAT;
        age_desc.offsetInBytes = 4 * 4;
        age_desc.vertexSize = 1;

        const life_desc = new SharedVertexBufferItemDescription();
        life_desc.layoutLocation = 4;
        life_desc.componentType = ComponentType.FLOAT;
        life_desc.offsetInBytes = 5 * 4;
        life_desc.vertexSize = 1;

        shared_buffer.sharedVertexBufferItems = [pos_desc, vel_desc, age_desc, life_desc];
        shared_buffer.bufferUsage = BufferUsage.STREAM_DRAW;
        shared_buffer.numberOfPrimitives = this.m_options.nOfParticles;
        shared_buffer.drawType = DrawType.POINTS;

        // create both, for two buffers.
        shared_buffer.glBuffer = buffer_update;
        this.m_readBuffer = new GLGeometryBuffer(this.m_gl, [vertexBuffer], null, shared_buffer, {
            instanced: true,
            instancesCount: this.m_options.nOfParticles
        });

        shared_buffer.glBuffer = buffer_render;
        this.m_writeBuffer = new GLGeometryBuffer(this.m_gl, [vertexBuffer], null, shared_buffer, {
            instanced: true,
            instancesCount: this.m_options.nOfParticles
        });
    }

    public update (delta_time: number): void
    {
        const inputManager = this.m_framework.input;
        const mouseState = inputManager.getMouseState();
        
        this.m_updateStepShader.emitNew = false;
        if (inputManager.getMouseState().leftButtonDown)
        {
            this.m_updateStepShader.emitNew = true;
        }

        this.m_updateStepShader.use();

        Vec2.copy(mouseState.position, this.m_updateStepShader.origin);
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
    private particlesData (): Float32Array
    {
        const data = [1];
        for (let i = 0; i < this.m_options.nOfParticles; i++)
        {
            // position
            data.push(0);
            data.push(0);

            // vel
            data.push(0);
            data.push(0);

            // current age. Push big number, so that all particles are restarted at beginning.
            data.push(Math.random() * 20000); // current age

            // max age. Max age of a particle
            data.push(Math.random() * 20000); // max age
        }

        return new Float32Array(data);
    }

    // #endregion Private Methods (1)
}