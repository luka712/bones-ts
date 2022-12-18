import { IRenderFramebuffer } from "../../bones_framebuffer";
import { Effect } from "../../bones_post_process";
import { ShaderUniform } from "../../shaders/Shader";

/**
 * The configurable post process pipeline.
 */
export class PostProcessPipeline 
{
    public framebuffer: IRenderFramebuffer;
    public effect: Effect;

    protected m_uniforms: { [id:string] : ShaderUniform} = {};

    /**
     * Gets the uniforms.
     */
    public get uniforms(): { [id:string] : ShaderUniform} 
    {
        return this.m_uniforms;
    }

    /**
     * Initialize the pipeline.
     */
    public async initialize(): Promise<void> 
    {
        this.framebuffer.initialize();
    }

    public bind(): void 
    {
        this.framebuffer.bind();
    }

    /**
     * Gets the uniform by name.
     */
    public getUniform(name: string) : ShaderUniform|undefined
    {
        return this.m_uniforms[name];
    }

    /**
     * Draw the pipeline pass.
     */
    public drawPass(): void 
    {
        this.effect.use();
        this.framebuffer.drawPass();
    }
}
