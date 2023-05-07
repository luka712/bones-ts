import { Framework } from "../../Framework";
import { ParticlesEmitter } from "../ParticlesEmitter";
import { ParticlesFactory } from "../ParticlesFactory";
import { GLTransformFeedbackParticlesEmitter } from "./GLParticlesEmitter";

export class GLParticlesFactory extends ParticlesFactory
{
    // #region Constructors (1)

    /**
     * The constructor.
     */
    constructor(protected readonly m_gl: WebGL2RenderingContext,
        protected readonly m_framework: Framework)
    {
        super();
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    /**
     * Creates the particles emitter.
     */
    public createParticlesEmitter (): ParticlesEmitter
    {
        return new GLTransformFeedbackParticlesEmitter(this.m_gl, this.m_framework);
    }

    // #endregion Public Methods (1)
}