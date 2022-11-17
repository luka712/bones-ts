import { prototype } from "events";
import { FileLoader } from "../../framework/bones_loaders";
import { TextureManager } from "../../framework/bones_texture";
import { InputManager } from "../../framework/InputManager";
import { ParticlesEmitter } from "../../framework/particles/ParticlesEmitter";
import { ParticlesFactory } from "../../framework/particles/ParticlesFactory";
import { WindowManager } from "../../framework/Window";
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
        return new GLTransformFeedbackParticlesEmitter(this.m_gl, this.m_fileLoader, this.m_inputManager, this.m_textureManager, this.m_window);
    }

}