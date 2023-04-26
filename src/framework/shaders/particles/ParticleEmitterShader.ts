import { Mat4x4, Vec2 } from "../../bones_math";
import { Texture2D } from "../../bones_texture";
import { Vec3 } from "../../math/vec/Vec3";
import { Shader } from "../Shader";

// TODO: this is experimental, not finished.

/**
 * The particle update step shader
 */
export abstract class ParticleEmitterUpdateStepShader extends Shader 
{
    /**
     * The randomness texture.
     */
    public randomTexture: Texture2D;

    public origin: Vec2 = Vec2.zero();

    public projectionViewMatrix: Mat4x4 = Mat4x4.identity();
    /**
     * Update the particle emitter.
     * @param { number } delta_time 
     */
    abstract update (delta_time: number): void;

}

export abstract class ParticleEmitterRenderStepShader extends Shader 
{

}