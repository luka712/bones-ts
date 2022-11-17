import { ParticlesEmitter } from "./ParticlesEmitter";

/**
 * The particles factory.
 */
export abstract class ParticlesFactory 
{
    /**
     * Creates the particles emitter.
     */
    public abstract createParticlesEmitter(): ParticlesEmitter;
}