import { Vec2 } from "../../framework/bones_math";
import { Texture2D } from "../../framework/bones_texture";
import { EffectShader } from "../../framework/shaders/EffectShader";
import { ShaderUniform, ShaderUniformType } from "../../framework/shaders/Shader";
import { GLShaderImplementation } from "./GLShaderImplementation";

/**
 * The effect shader.
 */
export class GLEffectShader extends EffectShader 
{
    private m_shader: GLShaderImplementation;

    private m_resolutionLocation: WebGLUniformLocation;
    private m_timeLocation: WebGLUniformLocation;
    private m_randomLocation: WebGLUniformLocation;

    // texture locations
    private m_texture0Location: WebGLUniformLocation;
    private m_texture1Location: WebGLUniformLocation;
    private m_texture2Location: WebGLUniformLocation;
    private m_texture3Location: WebGLUniformLocation;

    // the textures.
    public texture1?: Texture2D;
    public texture2?: Texture2D;
    public texture3?: Texture2D;


    /**
     * The constructor.
     * @param { WebGL2RenderingContext } gl 
     * @param { string } vertex_source 
     * @param { string } fragment_source 
     */
    constructor(private m_gl: WebGL2RenderingContext, vertex_source: string, fragment_source: string)
    {
        super();
        this.m_shader = new GLShaderImplementation(m_gl, vertex_source, fragment_source);
    }


    /**
     * Initialize the shader
     * @return { Promise<void>}
     */
    public async initialize (): Promise<void>
    {
        this.m_shader.initialize();

        // false for don't log message if not in shader.
        this.m_resolutionLocation = this.m_shader.getUniform("u_resolution", false);
        this.m_timeLocation = this.m_shader.getUniform("u_time", false);
        this.m_randomLocation = this.m_shader.getUniform("u_random", false);

        // framebuffer texture, must always exist.
        this.m_texture0Location = this.m_shader.getUniform("u_texture0");
        this.m_texture1Location = this.m_shader.getUniform("u_texture1", false);
        this.m_texture2Location = this.m_shader.getUniform("u_texture2", false);
        this.m_texture3Location = this.m_shader.getUniform("u_texture3", false);
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
   * @brief Pass resolution to shader effect.
   * 
   * @param { Vec2 } resolution 
   */
    public useResolution (resolution: Vec2): void 
    {
        if (this.m_resolutionLocation)
        {
            this.m_gl.uniform2f(this.m_resolutionLocation, resolution[0], resolution[1]);
        }
    }

    /**
     * @brief Send passed time in ms to shader.
     * 
     * @param { number } time 
     */
    public useTime (time: number): void
    {
        if (this.m_timeLocation)
        {
            this.m_gl.uniform1f(this.m_timeLocation, time);
        }
    }

    /**
     * Send random value to shader.
     * 
     * @param { number } random - random value
     * @returns { void } 
     */
    public useRandom (random: number): void 
    {
        if (this.m_randomLocation)
        {
            this.m_gl.uniform1f(this.m_randomLocation, random);
        }
    }

    /**
     * Use the texture unit 0.
     */
    public useTextureUnit0 (): void 
    {
        // framebuffer must be bound before calling here.
        if (this.m_texture0Location)
        {
            this.m_gl.activeTexture(this.m_gl.TEXTURE0 + 0);
            this.m_gl.uniform1i(this.m_texture0Location, 0);
        }
    }

    /**
     * Use the texture unit 1.
     */
    public useTextureUnit1 (): void 
    {
        if (this.texture1 && this.m_texture1Location)
        {
            this.m_gl.activeTexture(this.m_gl.TEXTURE0 + 1);
            this.m_gl.uniform1i(this.m_texture1Location, 1);
            this.texture1.bind();
        }
    }

    /**
     * Use the texture unit 2.
     */
    public useTextureUnit2 (): void 
    {
        if (this.texture2 && this.m_texture2Location)
        {
            this.m_gl.activeTexture(this.m_gl.TEXTURE0 + 2);
            this.m_gl.uniform1i(this.m_texture2Location, 2);
            this.texture2.bind();
        }
    }

    /**
    * Use the texture unit 3.
    */
    public useTextureUnit3 (): void 
    {
        if (this.texture3 && this.m_texture3Location)
        {
            this.m_gl.activeTexture(this.m_gl.TEXTURE0 + 3);
            this.m_gl.uniform1i(this.m_texture3Location, 3);
            this.texture3.bind();
        }
    }

    /**
     * Destroy the resource.
     */
    public destroy (): void  
    {
        this.m_shader.destroy();

        this.texture1?.destroy();
        this.texture2?.destroy();
        this.texture3?.destroy();
    }

}

