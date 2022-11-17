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
   public noiseTexture: Texture2D;
   public frictionFactor: number = 0.9999;
   public origin: Vec3 = Vec3.zero();

   public projectionMatrix: Mat4x4 = Mat4x4.identity();
   public viewMatrix: Mat4x4 = Mat4x4.identity();

   public xDirectionMinMax: Vec2 = new Vec2(-1, 1);
   public yDirectionMinMax: Vec2 = new Vec2(-1, 1);
   public zDirectionMinMax: Vec2 = new Vec2(-1, 1);
   public minMaxSpeed: Vec2 = new Vec2(5, 10);
   public force: Vec3 = Vec3.zero();
   public maxAge: number = 1000;

   /**
    * Update the particle emitter.
    * @param { number } delta_time 
    */
   abstract update (delta_time: number): void;

}

export abstract class ParticleEmitterRenderStepShader extends Shader 
{

}