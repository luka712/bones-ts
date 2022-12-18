import { Vec2 } from "../../framework/bones_math";
import { Vec3 } from "../../framework/math/vec/Vec3";
import { ShaderUniform, ShaderUniformType } from "../../framework/shaders/Shader";
import { GLShaderImplementation } from "./GLShaderImplementation";

/**
 * Sets the float uniform.
 * @param { WebGL2RenderingContext } gl 
 * @param { WebGLUniformLocation } location 
 * @param { number } value 
 */
function setFloatUniform(gl: WebGL2RenderingContext, location: WebGLUniformLocation, value: number): void 
{
    gl.uniform1f(location, value);
}


/**
 * Sets the vec2 uniform.
 * @param { WebGL2RenderingContext } gl 
 * @param { WebGLUniformLocation } location 
 * @param { Float32Array } value 
 */
function setVec2Uniform(gl: WebGL2RenderingContext, location: WebGLUniformLocation, value: Float32Array): void 
{
    gl.uniform2f(location, value[0], value[1]);
}

/**
 * Sets the vec2 uniform.
 * @param { WebGL2RenderingContext } gl 
 * @param { WebGLUniformLocation } location 
 * @param { Float32Array } value 
 */
 function setVec3Uniform(gl: WebGL2RenderingContext, location: WebGLUniformLocation, value: Float32Array): void 
 {
     gl.uniform3f(location, value[0], value[1], value[2]);
 }

 /**
  * Set the bool uniform.
  * @param gl 
  * @param location 
  * @param value 
  */
 function setBoolUniform(gl: WebGL2RenderingContext, location : WebGLUniformLocation, value: boolean) : void 
 {
    gl.uniform1i(location, value ? 1 : 0);
 }

type UniformValue = number | Float32Array | boolean;

/**
 * The GLShaderUniform implementaion of IShaderUniform.
 */
export class GLShaderUniform implements ShaderUniform
{
    // TODO: think about creating refresh bool, to avoid calling gpu ! 

    public value: Float32Array | number | boolean;
    public minValue: Float32Array | number;
    public maxValue: Float32Array | number;

    private __uniformLocation: WebGLUniformLocation;

    private static __map: { [id: number]: (gl: WebGLUniformLocation, location: WebGLUniformLocation, value: UniformValue) => void } = {
        [ShaderUniformType.Float]: setFloatUniform,
        [ShaderUniformType.Vec2]: setVec2Uniform,
        [ShaderUniformType.Vec3]: setVec3Uniform,
        [ShaderUniformType.Bool]: setBoolUniform
    }

    /**
     * The constructor.
     * @param { WebGL2RenderingContext } __gl 
     * @param { IShader } __shader 
     * @param { string } __locationName - the name as used in shader.
     * @param { ShaderUniformType } type 
     */
    constructor(private __gl: WebGL2RenderingContext, private __shader: GLShaderImplementation, private __locationName: string, public type: ShaderUniformType)
    {
        if (type == ShaderUniformType.Float)
        {
            this.value = 0;
            this.minValue = 0;
            this.maxValue = 1;
        }
        else if (type == ShaderUniformType.Vec2)
        {
            this.value = Vec2.zero();
            this.minValue = Vec2.zero();
            this.maxValue = Vec2.one();
        }
        else if (type == ShaderUniformType.Vec3)
        {
            this.value = Vec3.zero();
            this.minValue = Vec3.zero();
            this.maxValue = Vec3.one();
        }
        else if(type == ShaderUniformType.Bool)
        {
            this.value = true;
        }
        else 
        {
            // developers error. all cases should be handled.
            throw new Error("GLShaderUniform::constructor: unknown type!");
        }
    }
    /**
     * Use the uniform.
     */
    public use(): void
    {
        GLShaderUniform.__map[this.type](this.__gl, this.__uniformLocation, this.value);
    }

    /**
     * Initialize the shader uniform.
     */
    public initialize(): void
    {
        // use from shader, because if program is injected directly, it might be uninitialized.
        this.__uniformLocation = this.__gl.getUniformLocation(this.__shader.program, this.__locationName);

        if (!this.__uniformLocation)
        {
            console.error(`Unable to resolve uniform location ${this.__locationName}!`);
        }
    }
}
