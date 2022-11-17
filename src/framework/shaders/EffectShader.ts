import { Vec2 } from "../bones_math";
import { Texture2D } from "../bones_texture";
import { Shader } from "./Shader";


/**
 * @brief Shader to be used with effect.
 *
 * TODO: avoid IEffectShader, rename to just EffectShader... same is true of IShader
 */
export abstract class EffectShader extends Shader
{
    // Note, first texture unit is missing on purpose. It's reserved for framebuffer texture.

    /**
     * The texture to be used with texture unit 1.
     */
    public texture1?: Texture2D;

    /**
    * The texture to be used with texture unit 2.
    */
    public texture2?: Texture2D;

    /**
    * The texture to be used with texture unit 3.
    */
    public texture3?: Texture2D;

    /**
     * @brief Pass resolution to shader effect.
     *
     * @param { Vec2 } resolution
     */
    public abstract useResolution (resolution: Vec2): void;

    /**
     * @brief Sent passed time in ms to shader.
     *
     * @param { number } time
     */
    public abstract useTime (time: number): void;

    /**
     * Send random value to shader.
     *
     * @param { number } random - random value
     * @returns { void }
     */
    public abstract useRandom (random: number): void;

    /**
     * Use the texture unit 0.
     * @returns { void }
     */
    public abstract useTextureUnit0 (): void;

    /**
     * Use the texture unit 1.
     * @returns { void }
     */
    public abstract useTextureUnit1 (): void;

    /**
     * Use the texture unit 2.
     */
    public abstract useTextureUnit2 (): void;

    /**
     * Use the texture unit 3.
     */
    public abstract useTextureUnit3 (): void;
}