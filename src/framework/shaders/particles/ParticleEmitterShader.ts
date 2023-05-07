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
    // #region Properties (4)

    /**
     * The friction.
     */
    public frictionFactor = 0.9;
    public origin: Vec2 = Vec2.zero();
    public projectionViewMatrix: Mat4x4 = Mat4x4.identity();

    public emitNew: boolean = false;

    /**
     * The randomness texture.
     */
    public randomTexture: Texture2D;

    // #endregion Properties (4)

    // #region Public Abstract Methods (1)

    /**
     * Update the particle emitter.
     * @param { number } deltaTime 
     */
    public abstract update (deltaTime: number): void;

    // #endregion Public Abstract Methods (1)
}

export abstract class ParticleEmitterRenderStepShader extends Shader 
{

}