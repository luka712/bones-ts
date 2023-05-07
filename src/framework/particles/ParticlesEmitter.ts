
/**
 * The options of particle emitter.
 */
export interface ParticleEmitterOptions 
{
    /**
     * The number of particles
     */
    nOfParticles: number;
}

/**
 * The particle emitter.
 */
export abstract class ParticlesEmitter 
{

    /**
     * The constructor.
     */
    constructor(protected m_options: ParticleEmitterOptions = {
        nOfParticles: 10_000
    }){}

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