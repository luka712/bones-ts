import { FileLoader } from "../../../framework/bones_loaders";
import { TextureFiltering, TextureManager, TextureWrap } from "../../../framework/bones_texture";
import { ParticleEmitterRenderStepShader, ParticleEmitterUpdateStepShader } from "../../../framework/shaders/particles/ParticleEmitterShader";
import { ShaderUniformType, ShaderUniform } from "../../../framework/shaders/Shader";
import { GLShaderImplementation } from "../GLShaderImplementation";

// TODO: this is experimental, not finished


const BASE_FOLDER = "assets/framework/shaders/particles/"

export class GLParticleEmitterUpdateStepShader extends ParticleEmitterUpdateStepShader
{
    private m_shader: GLShaderImplementation;

    private m_projectionMatrixLocation: WebGLUniformLocation;
    private m_viewMatrixLocation: WebGLUniformLocation;

    private m_deltaTimeLocation: WebGLUniformLocation;

    private m_originLocation: WebGLUniformLocation;
    private m_minMaxSpeedLocation: WebGLUniformLocation;

    private m_forceLocation: WebGLUniformLocation;
    private m_frictionFactorLocation: WebGLUniformLocation;

    private m_maxAgeLocation: WebGLUniformLocation;

    private m_xDirectionMinMaxLocation: WebGLUniformLocation;
    private m_yDirectionMinMaxLocation: WebGLUniformLocation;
    private m_zDirectionMinMaxLocation: WebGLUniformLocation;


    // texture locations
    private m_texture0Location: WebGLUniformLocation;


    /**
     * The constructor.
     * @param { WebGL2RenderingContext  } gl - rendering context.
     * @param { FileLoader } m_fileLoader - the file loader.
     */
    constructor(private m_gl: WebGL2RenderingContext, private m_fileLoader: FileLoader, private m_textureManager: TextureManager)
    {
        super();

        this.m_shader = new GLShaderImplementation(m_gl, null, null, {
            transformFeedbackVaryings: ["v_position", "v_velocity", "v_acceleration", "v_age", "v_debug"] // must be set to attribute outputs
        });
    }

    /**
     * Initialize the shader.
     */
    public async initialize (): Promise<void>
    {
        const vertex_source = await this.m_fileLoader.loadFile(`${BASE_FOLDER}emitter/glsl_300es/update_step_v.glsl`);
        const fragment_source = await this.m_fileLoader.loadFile(`${BASE_FOLDER}glsl_300es/update_step_f.glsl`);

        this.m_shader.initialize(vertex_source, fragment_source);

        this.noiseTexture = await this.m_textureManager.loadTexture2D("assets/framework/textures/util/noise.png", "GLParticleEmitterUpdateStepShader::noise", {
            textureFiltering: TextureFiltering.Bilinear,
            textureWrap: TextureWrap.Repeat
        });

        this.m_texture0Location = this.m_shader.getUniform("u_texture0");

        this.m_projectionMatrixLocation = this.m_shader.getUniform("u_projectionMatrix");
        this.m_viewMatrixLocation = this.m_shader.getUniform("u_viewMatrix");

        this.m_deltaTimeLocation = this.m_shader.getUniform("u_deltaTime");

        this.m_originLocation = this.m_shader.getUniform("u_origin");

        this.m_xDirectionMinMaxLocation = this.m_shader.getUniform("u_xDirectionMinMax");
        this.m_yDirectionMinMaxLocation = this.m_shader.getUniform("u_yDirectionMinMax");
        this.m_zDirectionMinMaxLocation = this.m_shader.getUniform("u_zDirectionMinMax");

        this.m_minMaxSpeedLocation = this.m_shader.getUniform("u_minMaxSpeed");

        this.m_maxAgeLocation = this.m_shader.getUniform("u_maxAge")

        this.m_forceLocation = this.m_shader.getUniform("u_force");
        this.m_frictionFactorLocation = this.m_shader.getUniform("u_frictionFactor");
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
    * Call to use the shader, or to currently setup this shader.
    * @param { T1 | undefined } use_params - to pass if there are params to be passed. This is case when rendering with WebGPU which requires GPURenderPassEncoder.
    * For WebGL2 nothing is passed.
    * @returns { void }
    */
    public use<T1> (use_params?: T1): void
    {
        this.m_shader.use();
    }

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
     * Update the shader.
     * @param { number } delta_time 
     */
    public update (delta_time: number): void 
    {
        // matrices
        this.m_gl.uniformMatrix4fv(this.m_projectionMatrixLocation, false, this.projectionMatrix);
        this.m_gl.uniformMatrix4fv(this.m_viewMatrixLocation, false, this.viewMatrix);

        // age delta time
        this.m_gl.uniform1f(this.m_maxAgeLocation, this.maxAge);
        this.m_gl.uniform1f(this.m_deltaTimeLocation, delta_time);

        // speed origin frove
        this.m_gl.uniform2fv(this.m_minMaxSpeedLocation, this.minMaxSpeed);
        this.m_gl.uniform3fv(this.m_originLocation, this.origin);
        this.m_gl.uniform3fv(this.m_forceLocation, this.force);
        this.m_gl.uniform1f(this.m_frictionFactorLocation, this.frictionFactor);

        // direction
        this.m_gl.uniform2fv(this.m_xDirectionMinMaxLocation, this.xDirectionMinMax);
        this.m_gl.uniform2fv(this.m_yDirectionMinMaxLocation, this.yDirectionMinMax);
        this.m_gl.uniform2fv(this.m_zDirectionMinMaxLocation, this.zDirectionMinMax);

        this.noiseTexture.active(0);
        this.noiseTexture.bind();

    }

    /**
     * Destroys the shader.
     */
    public destroy (): void
    {
        this.m_shader.destroy();
    }
}

export class GLParticleEmitterRenderStepShader extends ParticleEmitterRenderStepShader
{
    private m_shader: GLShaderImplementation;

    /**
    * The constructor.
    * @param { WebGL2RenderingContext  } gl - rendering context.
    * @param { FileLoader } m_fileLoader - the file loader.
    */
    constructor(gl: WebGL2RenderingContext, private m_fileLoader: FileLoader)
    {
        super();
        this.m_shader = new GLShaderImplementation(gl);
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
    * Call to use the shader, or to currently setup this shader.
    * @param { T1 | undefined } use_params - to pass if there are params to be passed. This is case when rendering with WebGPU which requires GPURenderPassEncoder.
    * For WebGL2 nothing is passed.
    * @returns { void }
    */
    public use<T1> (use_params?: T1): void
    {
        this.m_shader.use();
    }

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
     * Initialize the shader.
     */
    public async initialize (): Promise<void>
    {
        const vertex_source = await this.m_fileLoader.loadFile(`${BASE_FOLDER}emitter/glsl_300es/render_step_v.glsl`)
        const fragment_source = await this.m_fileLoader.loadFile(`${BASE_FOLDER}emitter/glsl_300es/render_step_f.glsl`)

        this.m_shader.initialize(vertex_source, fragment_source);
    }

    /**
     * Destroys the shader.
     */
    public destroy (): void
    {
        this.m_shader.destroy();
    }
}