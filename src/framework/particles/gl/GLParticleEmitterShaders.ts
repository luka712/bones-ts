import { FileLoader } from "../../bones_loaders";
import { TextureFiltering, TextureManager, TextureWrap } from "../../bones_texture";
import { ParticleEmitterRenderStepShader, ParticleEmitterUpdateStepShader } from "../../shaders/particles/ParticleEmitterShader";
import { ShaderUniformType, ShaderUniform } from "../../shaders/Shader";
import { GLShaderImplementation } from "../../../webgl/shaders/GLShaderImplementation";
import particleEmitterRenderStepVShader from "./shaders/particles-render-v-shader.glsl?raw"
import particleEmitterRenderStepFShader from "./shaders/particles-render-f-shader.glsl?raw"
import particleEmitterUpdateStepVShader from "./shaders/particles-update-v-shader.glsl?raw"
import { Framework } from "../../Framework";

export class GLParticleEmitterUpdateStepShader extends ParticleEmitterUpdateStepShader
{
    // #region Properties (5)

    private readonly m_shader: GLShaderImplementation;

    private m_deltaTimeLocation: WebGLUniformLocation;
    private m_frictionFactorLocation: WebGLUniformLocation;
    private m_originLocation: WebGLUniformLocation;
    private m_projectionViewMatrixLocation: WebGLUniformLocation;
    private m_emitNewLocation: WebGLUniformLocation;

    // #endregion Properties (5)

    // #region Constructors (1)

    /**
     * The constructor.
     */
    constructor(private m_gl: WebGL2RenderingContext, private m_framework: Framework)
    {
        super();

        this.m_shader = new GLShaderImplementation(m_gl, null, null, {
            transformFeedbackVaryings: ["v_position", "v_velocity", "v_currentAge", "v_maxAge"] // must be set to attribute outputs
        });
    }

    // #endregion Constructors (1)

    // #region Public Methods (7)

    /**
    * Used by WebGPU. If there is per instance uniforms, use this to bind and prepare uniforms.
    * @param { number } instance_index 
    * @returns { void }
    */
    public bindInstance (instance_index: number): void
    {
        this.m_shader.bindInstance(instance_index);
    }

    /**
   * Creates a uniform value.
   * @param { string } uniform_name - the name of uniform in shader.
   * @param { ShaderUniformType } type - the type of a uniform.
   * @param { string | undefined } key - if key is used, uniform can be read from 'uniformValues' by key instead of using 'uniform_name'.
   */
    public createUniform (uniform_name: string, type: ShaderUniformType, key?: string): ShaderUniform
    {
        return this.m_shader.createUniform(uniform_name, type, key);
    }

    /**
     * Destroys the shader.
     */
    public destroy (): void
    {
        this.m_shader.destroy();
    }

    /**
     * @inheritdoc
     */
    public getUniform (uniform_name: any): ShaderUniform | undefined
    {
        return this.m_shader.getUniform(uniform_name);
    }

    /**
     * Initialize the shader.
     */
    public async initialize (): Promise<void>
    {
        this.m_shader.initialize(particleEmitterUpdateStepVShader, particleEmitterRenderStepFShader);

        this.randomTexture = await this.m_framework.textureManager.createRandomnessTexture("__random__", 512, 512);

        this.m_projectionViewMatrixLocation = this.m_shader.getUniformLocation("u_projectionViewMatrix");

        this.m_deltaTimeLocation = this.m_shader.getUniformLocation("u_deltaTime");

        this.m_originLocation = this.m_shader.getUniformLocation("u_origin");

        this.m_frictionFactorLocation = this.m_shader.getUniformLocation("u_frictionFactor");

        this.m_emitNewLocation = this.m_shader.getUniformLocation("u_emitNew");
    }

    /**
     * Update the shader.
     * @param { number } delta_time 
     */
    public update (delta_time: number): void 
    {
        const gl = this.m_gl;

        // matrices
        this.m_gl.uniformMatrix4fv(this.m_projectionViewMatrixLocation, false, this.projectionViewMatrix);

        // age delta time
        this.m_gl.uniform1f(this.m_deltaTimeLocation, delta_time);

        // speed origin frove
        this.m_gl.uniform2fv(this.m_originLocation, this.origin);

        gl.uniform1f(this.m_frictionFactorLocation, this.frictionFactor);
        gl.uniform1i(this.m_emitNewLocation, this.emitNew ? 1 : 0);

        this.randomTexture.active(0);
        this.randomTexture.bind();
    }

    /**
    * Call to use the shader, or to currently setup this shader.
    * @param { T1 | undefined } use_params - to pass if there are params to be passed. This is case when rendering with WebGPU which requires GPURenderPassEncoder.
    * For WebGL2 nothing is passed.
    * @returns { void }
    */
    public use<T1> (use_params?: T1): void
    {
        this.m_shader.use();
    }

    // #endregion Public Methods (7)
}

export class GLParticleEmitterRenderStepShader extends ParticleEmitterRenderStepShader
{
    // #region Properties (2)

    private m_resolutionLocation: WebGLUniformLocation;
    private m_shader: GLShaderImplementation;

    // #endregion Properties (2)

    // #region Constructors (1)

    /**
    * The constructor.
    * @param { WebGL2RenderingContext  } gl - rendering context.
    * @param { FileLoader } m_fileLoader - the file loader.
    */
    constructor(private m_gl: WebGL2RenderingContext, private m_framework: Framework)
    {
        super();
        this.m_shader = new GLShaderImplementation(m_gl);
    }

    // #endregion Constructors (1)

    // #region Public Methods (7)

    /**
    * Used by WebGPU. If there is per instance uniforms, use this to bind and prepare uniforms.
    * @param { number } instance_index 
    * @returns { void }
    */
    public bindInstance (instance_index: number): void
    {
        this.m_shader.bindInstance(instance_index);
    }

    /**
     * Creates a uniform value.
     * @param { string } uniform_name - the name of uniform in shader.
     * @param { ShaderUniformType } type - the type of a uniform.
     * @param { string | undefined } key - if key is used, uniform can be read from 'uniformValues' by key instead of using 'uniform_name'.
     */
    public createUniform (uniform_name: string, type: ShaderUniformType, key?: string): ShaderUniform
    {
        return this.m_shader.createUniform(uniform_name, type, key);
    }

    /**
     * Destroys the shader.
     */
    public destroy (): void
    {
        this.m_shader.destroy();
    }

    /**
     * @inheritdoc
     */
    public getUniform (uniform_name: any): ShaderUniform | undefined
    {
        return this.m_shader.getUniform(uniform_name);
    }

    /**
     * Initialize the shader.
     */
    public async initialize (): Promise<void>
    {
        this.m_shader.initialize(particleEmitterRenderStepVShader, particleEmitterRenderStepFShader);
        this.m_resolutionLocation = this.m_shader.getUniformLocation("u_resolution");
    }

    /**
    * Call to use the shader, or to currently setup this shader.
    * @param { T1 | undefined } use_params - to pass if there are params to be passed. This is case when rendering with WebGPU which requires GPURenderPassEncoder.
    * For WebGL2 nothing is passed.
    * @returns { void }
    */
    public use<T1> (use_params?: T1): void
    {
        this.m_shader.use();

        const gl = this.m_gl;
        gl.uniform2f(this.m_resolutionLocation, this.m_framework.window.width, this.m_framework.window.height);
    }

    // #endregion Public Methods (7)
}