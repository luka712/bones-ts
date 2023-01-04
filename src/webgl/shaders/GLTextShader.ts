import { FileLoader } from "../../framework/bones_loaders";
import { Mat4x4, Color } from "../../framework/bones_math";
import { ShaderUniformType, ShaderUniform } from "../../framework/shaders/Shader";
import { TextShader } from "../../framework/shaders/TextShader";
import { GLShaderImplementation } from "./GLShaderImplementation";

/**
 * The text shader.
 */
 export class GLTextShader extends TextShader 
 {
   
    private m_shader : GLShaderImplementation;

     private m_projectionLocation: WebGLUniformLocation;
     private m_viewLocation: WebGLUniformLocation;
     private m_transformLocation: WebGLUniformLocation;
     private m_colorLocation: WebGLUniformLocation;
 
     /**
      * The constructor.
      * @param { WebGL2RenderingContext  } gl - rendering context.
      * @param { FileLoader } m_fileLoader - the file loader.
      */
     constructor(private m_gl: WebGL2RenderingContext, private m_fileLoader: FileLoader)
     {
         super();
         this.m_shader = new GLShaderImplementation(m_gl);
     }
 
     /**
      * Initialize the shader.
      */
     public async initialize(): Promise<void>
     {
         const vertex_source = await this.m_fileLoader.loadFile("assets/framework/shaders/text/text_v_webgl.glsl")
         const fragment_source = await this.m_fileLoader.loadFile("assets/framework/shaders/text/text_f_webgl.glsl");
 
         await this.m_shader.initialize(vertex_source, fragment_source);
 
         this.m_projectionLocation = this.m_shader.getUniformLocation("u_projection_matrix");
         this.m_viewLocation = this.m_shader.getUniformLocation("u_view_matrix");
         this.m_transformLocation = this.m_shader.getUniformLocation("u_transform_matrix");
         this.m_colorLocation = this.m_shader.getUniformLocation("u_color")
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
     * @inheritdoc
     */
    public getUniform (uniform_name: any): ShaderUniform | undefined
    {
        return this.m_shader.getUniform(uniform_name);
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
      * Use the projection and view matrix.
      *
      * @param { Mat4x4 } projection_matrix
      * @param { Mat4x4 } view_matrix
      */
     public useCamera(projection_matrix: Mat4x4, view_matrix: Mat4x4): void
     {
         this.m_gl.uniformMatrix4fv(this.m_projectionLocation, false, projection_matrix);
         this.m_gl.uniformMatrix4fv(this.m_viewLocation, false, view_matrix);
     }
 
     /**
      * Use the transform matrix.
      *
      * @param { Mat4x4 } transform_matrix
      */
     public useTransform(transform_matrix: Mat4x4): void
     {
         this.m_gl.uniformMatrix4fv(this.m_transformLocation, false, transform_matrix);
     }
 
 
     /**
      * Set the color of a font.
      *
      * @param { Color } color
      */
     public useColor(color: Color): void
     {
         this.m_gl.uniform4fv(this.m_colorLocation, color);
     }

     /**
      * Destroys the shader.
      */
     public destroy (): void
     {
        this.m_shader.destroy();
     }
 }