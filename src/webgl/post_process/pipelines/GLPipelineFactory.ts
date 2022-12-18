import { IEffectFactory } from "../../../framework/bones_post_process";
import { IRenderer } from "../../../framework/bones_renderer";
import { PostProcessPipelineFactory } from "../../../framework/post_process/pipelines/PostProcessPipelineFactory";
import { PostProcessPipeline } from "../../../framework/post_process/pipelines/PostProcessPipeline";
import { WindowManager } from "../../../framework/Window";
import { GLBloomPipeline } from "./GLBloomPipeline";

export class GLPipelineFactory extends PostProcessPipelineFactory
{
    /**
     * The constructor.
     * @param m_windowManager 
     * @param m_renderer 
     * @param m_gl 
     * @param m_effectFactory 
     */
    constructor(private m_windowManager: WindowManager,
        private m_renderer: IRenderer,
        private m_gl: WebGL2RenderingContext,
        private m_effectFactory: IEffectFactory)
    {
        super();
    }

    /**
     * @inheritdoc
     */
    public async createBloomEffectPipeline (): Promise<PostProcessPipeline> 
    {
        const result = new GLBloomPipeline(this.m_windowManager, this.m_renderer, this.m_gl, this.m_effectFactory);
        result.initialize();
        return result;
    }
}