import { LifecycleState } from "./bones_common";
import { IRenderFramebuffer } from "./bones_framebuffer";
import { IRenderer } from "./bones_renderer";
import { TimeManager } from "./bones_time";
import { EffectShader } from "./shaders/EffectShader";

/**
 * The post processing manager.
 */
abstract class PostProcessManager 
{
    protected m_currentEffect: Effect;
    protected m_frameBuffer: IRenderFramebuffer;
    protected m_renderer: IRenderer;

    protected m_lifeCycleState: LifecycleState;

    /**
     * @brief Initialize the post process manager.
     */
    public abstract initialize (): void;

    /**
     * @brief Prepares effect for cathing all the renderer objects to apply effect for.
     * @param { Effect } effect
     * @returns { void }
     */
    public beforeRender (effect: Effect): void 
    {
        this.m_currentEffect = effect;
        this.m_frameBuffer.bind();
        this.m_frameBuffer.clear(this.m_renderer.clearColor);
    }

    /**
     * @brief Draws all the object that were caught in effect from BeforeRender.
     *
     */
    public afterRender (): void
    {
        if (this.m_currentEffect)
        {
            this.m_currentEffect.use();
            this.m_frameBuffer.drawPass();
        }
        this.m_currentEffect = null;
    }
}

/**
 * The effect factory.
 */
interface IEffectFactory 
{
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