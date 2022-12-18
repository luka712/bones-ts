import { LifecycleState } from "../../framework/bones_common";
import { PostProcessManager } from "../../framework/bones_post_process";
import { IRenderer } from "../../framework/bones_renderer";
import { PostProcessPipeline } from "../../framework/post_process/pipelines/PostProcessPipeline";
import { WindowManager } from "../../framework/Window";
import { GLRenderFrameBuffer } from "../framebuffer/GLRenderFrameBuffer";

/**
 * The gl post process manager.
 */
export class GLPostProcessManager extends PostProcessManager 
{
    private m_state: LifecycleState;

    /**
     * The constructor.
     * @param { WindowManager } window_manager 
     * @param { IRenderer } renderer 
     * @param { WebGL2RenderingContext } gl 
     */
    constructor(window_manager: WindowManager, renderer: IRenderer, gl: WebGL2RenderingContext)
    {
        super();
        this.m_defaultPipeline = new PostProcessPipeline();
        this.m_defaultPipeline.framebuffer = new GLRenderFrameBuffer(window_manager, renderer, gl);
        this.m_renderer = renderer;
    }

    public async initialize (): Promise<void>
    {
        if (this.m_state != LifecycleState.Initialized)
        {
            await this.m_defaultPipeline.initialize();
        }
        this.m_state = LifecycleState.Initialized;
    }

}