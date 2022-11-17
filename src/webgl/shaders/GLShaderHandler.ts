import { ShaderType } from "../../framework/shaders/Shader";
import { GLShaderOptions } from "./GLShaderImplementation";


export class GLShaderHandler 
{
    /**
     * Create a shader of the given type, uploads the source and compiles it.
     *
     * @param { WebGL2RenderingContext } gl
     * @param { ShaderType } type
     * @param { string } source
     * @return { WebGLProgram | null } the WebGLProgram on success, null if compilation fails.
     */
    public static loadShader (gl: WebGL2RenderingContext, type: ShaderType, source: string): WebGLProgram | null
    {
        const gl_shader = gl.createShader(type == ShaderType.VERTEX_SHADER ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
        gl.shaderSource(gl_shader, source);
        gl.compileShader(gl_shader);

        const success = gl.getShaderParameter(gl_shader, gl.COMPILE_STATUS);
        if (!success)
        {
            const error = gl.getShaderInfoLog(gl_shader);
            const msg = `An error occured while compiling the shaders: ${error}`;
            console.error(msg);
            return null;
        }

        return gl_shader;
    }

    /**
     * @brief Create and intialize a shader program.
     *
     * @param { WebGL2RenderingContext } gl
     * @param { string } vertex_shader_source
     * @param { string } fragment_shader_source
     * @return { WebGLProgram | null } - return program on success, null otherwise.
     */
    public static initShaderProgram (gl: WebGL2RenderingContext, vertex_shader_source: string, fragment_shader_source: string, options?: GLShaderOptions): WebGLProgram | null
    {
        const vertex_shader = GLShaderHandler.loadShader(gl, ShaderType.VERTEX_SHADER, vertex_shader_source);
        const fragment_shader = GLShaderHandler.loadShader(gl, ShaderType.FRAGMENT_SHADER, fragment_shader_source);

        // create a shader program
        const shader_program = gl.createProgram();
        gl.attachShader(shader_program, vertex_shader);
        gl.attachShader(shader_program, fragment_shader);

        // here specify additional shader stuff, such as feedback varyings
        if (options?.transformFeedbackVaryings)
        {
            gl.transformFeedbackVaryings(shader_program, options.transformFeedbackVaryings, gl.INTERLEAVED_ATTRIBS);
        }
        gl.linkProgram(shader_program);

        // see if compiled successfully
        const success = gl.getProgramParameter(shader_program, gl.LINK_STATUS);
        if (!success)
        {
            const log = gl.getProgramInfoLog(shader_program);
            const msg = `Unable to initalize the shader program ${log}.`;
            console.error(msg);
            return null;
        }

        gl.deleteShader(vertex_shader);
        gl.deleteShader(fragment_shader);

        return shader_program;
    }
}
