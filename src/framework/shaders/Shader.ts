
export enum ShaderUniformType
{
    Float = 0,
    Vec2 = 1,
    Vec3 = 2,
}

export interface ShaderUniform
{
    /**
     * The type of uniform.
     */
    readonly type: ShaderUniformType;

    /**
     * Any value that can be passed to shader.
     */
    value: Float32Array | number;

    /**
     * Minimum value that should be used.
     */
    minValue: Float32Array | number;

    /**
     * Maximum value that should be used.
     */
    maxValue: Float32Array | number;

    /**
     * Initialize the shader uniform.
     */
    initialize (): void;

    /**
     * Mainly used as internal function.
     * Can only be called if shader that uniform belongs to is used.
     */
    use (): void;
}


/**
 * The type of shader.
 */
export enum ShaderType 
{
    FRAGMENT_SHADER,
    VERTEX_SHADER,
    COMPUTE_SHADER
}

/**
 * Shader usage will always look something like this 
 * 
 * use
 * bindPerPass uniforms
 * bindInstance 
 * bindPerInstance uniforms
 * bindInstance
 * bindPerInstance uniforms
 * bindInstance
 * bindPerInstance uniforms
 * ...
 */


/**
 * The shader interface.
 */
export abstract class Shader
{
    /**
     * All the custom shader uniforms to be exposed to user to freely change.
     */
    readonly uniformValues: { [id: string]: ShaderUniform };

    /**
     * Creates a uniform value.
     * @param { string } uniform_name - the name of uniform in shader.
     * @param { ShaderUniformType } type - the type of a uniform.
     * @param { string | undefined } key - if key is used, uniform can be read from 'uniformValues' by key instead of using 'uniform_name'.
     */
    public abstract createUniform (
        uniform_name: string,
        type: ShaderUniformType,
        key?: string
    ): ShaderUniform;

    /**
     * Initialize the shader.
     */
    public abstract initialize (): Promise<void>;

    /**
     * Call to use the shader, or to currently setup this shader.
     * @param { T1 | undefined } use_params - to pass if there are params to be passed. This is case when rendering with WebGPU which requires GPURenderPassEncoder.
     * For WebGL2 nothing is passed.
     * @returns { void }
     */
    public abstract use<T1> (use_params?: T1): void;

    /**
     * Used by WebGPU. If there is per instance uniforms, use this to bind and prepare uniforms.
     * @param { number } instance_index 
     * @returns { void }
     */
    public abstract bindInstance (instance_index: number): void;

    /**
     * Destroy the shader.
     */
    public abstract destroy (): void;
}
