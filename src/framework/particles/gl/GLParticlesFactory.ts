import { WindowManager } from "../../Window";
import { FileLoader } from "../../bones_loaders";
import { TextureManager } from "../../bones_texture";
import { InputManager } from "../../input/InputManager";
import { ParticlesEmitter } from "../ParticlesEmitter";
import { ParticlesFactory } from "../ParticlesFactory";
import { GLTransformFeedbackParticlesEmitter } from "./GLParticlesEmitter";

export class GLParticlesFactory extends ParticlesFactory
{
    /**
     * The constructor.
     */
    constructor(protected m_gl: WebGL2RenderingContext,
        protected m_fileLoader: FileLoader,
        protected m_inputManager: InputManager,
        protected m_textureManager: TextureManager,
        protected m_window: WindowManager)
    {
        super();
    }

    /**
     * Creates the particles emitter.
     */
    public createParticlesEmitter (): ParticlesEmitter
    {
        return new GLTransformFeedbackParticlesEmitter(this.m_gl, this.m_fileLoader, this.m_inputManager, this.m_textureManager);
    }

}