// TODO: experimental, not finished.

/**
 * The particle emitter.
 */
export abstract class ParticlesEmitter 
{
    /**
     * Initialize particle emitter.
     */
    public abstract initialize(): void;
    
    /**
     * Updates the particles.
     * @param { number } delta_time 
     */
    public abstract update(delta_time: number) : void;

    /**
     * Draw particles.
     */
    public abstract draw(): void;
}