import { unwatchFile } from "fs";
import { LifecycleState } from "../../framework/bones_common";
import { Shader, ShaderUniform, ShaderUniformType } from "../../framework/shaders/Shader";
import { GLShaderHandler } from "./GLShaderHandler";
import { GLShaderUniform } from "./GLShaderUniform";

export interface GLShaderOptions 
{
    transformFeedbackVaryings?: Array<string>;
}


/**
  * Class that all other shader types create.
  * Shader is implemented only by one, and only one class, every other 
  * shader class will either inject shader or create an instance of it as field.
  */
export class GLShaderImplementation extends Shader 
{
    /**
     * The id of a program.
     */
    public program: WebGLProgram;

    /**
     * The lifecycle state.
     */
    protected state: LifecycleState;

    /**
     * All the custom shader uniforms to be exposed to user to freely change.
     */
    public readonly uniformValues: { [id: string]: ShaderUniform; };

    /**
     * The constructor.
     * @param { WebGL2RenderingContext } m_gl 
     */
    constructor(protected m_gl: WebGL2RenderingContext,
        protected m_vertexSource: string = null,
        protected m_fragmentSource: string = null,
        protected m_options?: GLShaderOptions)
    {
        super();
        this.uniformValues = {};
    }

    /**
     * Used by WebGPU.
     */
    public bindInstance (instance_index: number)
    {
        // do nothing. WebGPU
    }

    /**
      * Creates a uniform value.
      * @param { string } uniform_name - the name of uniform in shader.
      * @param { ShaderUniformType } type - the type of a uniform.
      * @param { string | undefined } key - if key is used, uniform can be read from 'uniformValues' by key instead of using 'uniform_name'.
      */
    public createUniform (uniform_name: string, type: ShaderUniformType, key?: string): ShaderUniform
    {
        // use key or unifrom name if key is null.
        key = key ?? uniform_name;

        if (this.uniformValues[key]) 
        {
            throw new Error(`IShader::createUniform: Key ${key} is already used!`);
        }

        this.uniformValues[key] = new GLShaderUniform(this.m_gl, this, uniform_name, type);
        return this.uniformValues[key];
    }

    
    /**
     * @inheritdoc
     */
    public getUniform (uniform_name: any): ShaderUniform | undefined
    {
        return this.uniformValues[uniform_name];
    }
 

    /**
     * Use/Bind the program
     */
    public use (): void
    {
        this.m_gl.useProgram(this.program);

        for (const uniform_key in this.uniformValues)
        {
            this.uniformValues[uniform_key].use();
        }
    }

    /**
      * Initialize the shader.
      */
    public async initialize (vertex_source?: string, fragment_source?: string): Promise<void>
    {
        // use either from constructor passed params or from initalize.
        vertex_source = vertex_source ?? this.m_vertexSource;
        fragment_source = fragment_source ?? this.m_fragmentSource;

        if(!vertex_source || !fragment_source)
        {
            throw new Error(`GLShaderImplementation::initialize: shader source is missing.`);
        }

        this.program = GLShaderHandler.initShaderProgram(this.m_gl, vertex_source, fragment_source , this.m_options);
        this.m_gl.useProgram(this.program);
        this.state = LifecycleState.Initialized;

        for (const key in this.uniformValues)
        {
            this.uniformValues[key].initialize();
        }
    }

    /**
     * Destroy the shader and it's resources.
     */
    public destroy (): void
    {
        if (this.state != LifecycleState.Destroyed)
        {
            this.m_gl.deleteProgram(this.program);
        }
        this.state = LifecycleState.Destroyed;
    }

    /**
     * Get the Unfiform location integer value from shader.
     *
     * @param { string } uniform value from shader, for example u_projectionMatrix
     * @param { boolean } log_warning- if true, warns if uniform is not found.
     * @return { WebGLUniformLocation } address of the unfirom
     */
    public getUniformLocation (uniform: string, log_warning: boolean = true): WebGLUniformLocation
    {
        var result = this.m_gl.getUniformLocation(this.program, uniform);
        if (!result && log_warning)
        {
            console.error(`Unable to resolve uniform ${uniform} !`);
        }
        return result;
    }

}