import { LifecycleState } from "./bones_common";
import { IRenderer } from "./bones_renderer";
import { Texture2D } from "./bones_texture";
import { TimeManager } from "./bones_time";
import { PostProcessPipeline } from "./post_process/pipelines/PostProcessPipeline";
import { EffectShader } from "./shaders/EffectShader";



/**
 * The post processing manager.
 */
abstract class PostProcessManager 
{
    /**
     * Default pipeline should work with 1 framebuffer and simple effect.
     * For more advanced pipelines, they need to be created or used and set by user.
     */
    protected m_defaultPipeline: PostProcessPipeline;

    /**
     * Currently bound pipeline.
     */
    protected m_currentPipeline: PostProcessPipeline

    protected m_renderer: IRenderer;

    protected m_lifeCycleState: LifecycleState;

    /**
     * @brief Initialize the post process manager.
     */
    public abstract initialize (): Promise<void>;

    /**
     * @brief Prepares effect for cathing all the renderer objects to apply effect for.
     * @param { Effect } effect
     * @returns { void }
     */
    public beforeRender (effect: Effect): void 
    {
        // reset pipeline to default one, whenever before render is used.
        this.m_currentPipeline = this.m_defaultPipeline;
        this.m_currentPipeline.effect = effect;
        this.m_defaultPipeline.framebuffer.bind();
        this.m_defaultPipeline.framebuffer.clear(this.m_renderer.clearColor);
    }

    /**
     * Use custom pipeline instead of using default one with passed in effect.
     * @param pipeline 
     */
    public beforeRenderUsePipeline(pipeline: PostProcessPipeline) : void 
    {
        this.m_currentPipeline = pipeline;
        this.m_currentPipeline.bind();
    }

    /**
     * @brief Draws all the object that were caught in effect from BeforeRender.
     *
     */
    public afterRender (): void
    {
        if (this.m_currentPipeline)
        {
            this.m_currentPipeline.drawPass();
        }
        this.m_currentPipeline = null;
    }
}

/**
 * Create the GL effects options.
 */
export class CreateEffectOptions 
{
    public texture0?: Texture2D;
    public texture1?: Texture2D;
    public texture2?: Texture2D;
    public texture3?: Texture2D;
}

/**
 * The effect factory.
 */
interface IEffectFactory 
{

    /**
     * Create one effect.
     * @param vertex_path 
     * @param fragment_path 
     * @param options - the options to pass.
     */
    create (vertex_path: string, fragment_path: string, options?: CreateEffectOptions): Promise<Effect>

    /**
     * @brief Create a Gray Scale Effect object.
     *
     * @return { Promise<Effect> }
     */
    createGrayScaleEffect (): Promise<Effect>;

    /**
     * @brief Create a Orderer Dithering Effect object.
     *
     * @return { Promise<Effect> }
     */
    orderedDitheringEffect (): Promise<Effect>;

    /**
     * @brief Create the chromatic aberration effect.
     *
     * @return { Promise<Effect> }
     */
    chromaticAberrationEffect (): Promise<Effect>;

    /**
     * @brief Create the chromatic aberration effect.
     *
     * @return { Promise<Effect> }
     */
    crtEffect (): Promise<Effect>;

    /**
     * Uses weighted color from framebuffer texture ( texture unit 0) as input texture coordinate for second texture ( texture unit 0).
     * Then texel from second texture at position with x and y being weighted color, is used as final output.
     * For example.
     * For weighted color of 0.25, output is texel at position (0.25, 0.25) of second texture.   
     * 
     * @return { Promise<Effect> }
     */
    texelColorEffect (): Promise<Effect>;
}

/**
 * @brief Shader to be used with effect.
 */
class Effect 
{
    /**
     * The constructor.
     * @param { IRenderer } m_renderer 
     * @param { TimeManager } m_timeManager 
     * @param { IEffectShader } shader 
     */
    constructor(private m_renderer: IRenderer, private m_timeManager: TimeManager, public shader: EffectShader)
    {

    }

    /**
     * @brief Initialize the effect.
     */
    public async initialize (): Promise<void> 
    {
        await this.shader.initialize();
    }

    /**
     * @brief Use the effect.
     */
    public use (): void 
    {
        this.shader.use();
        this.shader.useResolution(this.m_renderer.bufferSize);
        this.shader.useTime(this.m_timeManager.time.elapsedTimeSec);
        this.shader.useRandom(Math.random());
        this.shader.useTextureUnit1();
        this.shader.useTextureUnit2();
        this.shader.useTextureUnit3();
    }
}

export 
{
    PostProcessManager,
    IEffectFactory,
    Effect
}