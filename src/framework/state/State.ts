import { LifecycleState } from "../bones_common";
import { Config } from "../bones_config";
import { Framework } from "../Framework";
import { InputManager } from "../InputManager";
import { IEffectFactory, PostProcessManager } from "../bones_post_process";
import { SpriteRenderer } from "../SpriteRenderer";
import { TextureManager } from "../bones_texture";
import { TextRenderManager } from "../TextRenderer";
import { TimeManager } from "../bones_time";
import { WindowManager } from "../Window";
import { SpriteFontManager } from "../fonts/SpriteFontManager";
import { SoundManager } from "../sounds/SoundManager";
import { FrameworkPlugin } from "../plugin/FrameworkPlugin";
import { ParticlesFactory } from "../particles/ParticlesFactory";

/**
 * @brief The state of framework. State can be used for transitions.
 * For example intro state, game state, outro state.
 *
 * STATE LIFECYCLE
 * - OnInitialize - called once, when state is registered/added.
 * - OnEnter - called multiple times, after every transition into state.
 * - OnUpdate - called on each update.
 * - OnDraw - called on each draw.
 * - OnExit - called multiple times, after every transition out of state.
 * - OnDestroyed - called once, if state is unregistered/removed.
 */
export abstract class State
{

    /**
     * @brief The lifecycle state.
     */
    private m_state: LifecycleState;

    /**
     * @brief The window manager.
     */
    public readonly window: WindowManager;

    /**
     * @brief The font manager.
     */
    public readonly fontManager: SpriteFontManager;

    /**
     * @brief Create the prefined effect.
     */
    public readonly effects: IEffectFactory;

    /**
     * @brief The config.
     */
    public readonly config: Config;

    /**
     * @brief The texture manager.
     */
    public readonly textureManager: TextureManager;

    /**
     * @brief The sprite renderer.
     */
    public readonly spriteRenderer: SpriteRenderer;

    /**
     * @brief The text renderer.
     */
    public readonly textRenderer: TextRenderManager;

    /**
     * @brief The input.
     */
    public readonly input: InputManager;

    /**
     * @brief The post process manager.
     */
    public readonly postProcessManager: PostProcessManager;

    /**
    * @brief The time manager.
    */
    public readonly timeManager: TimeManager;

    /**
     * The sound manager.
     */
    public readonly soundManager: SoundManager;

    /**
     * The particles factory.
     * @see {@link ParticlesFactory}
     */
    public readonly particles: ParticlesFactory;

    /**
     * @brief Construct a new State object.
     *
     * @param framework - the framework.
     */
    constructor(private readonly framework: Framework)
    {
        this.m_state = LifecycleState.Created;

        this.window = framework.window;
        this.fontManager = framework.fontManager;
        this.config = framework.config;
        this.textureManager = framework.textureManager;
        this.textRenderer = framework.textRenderManager;
        this.spriteRenderer = framework.spriteRenderer;
        this.input = framework.input;
        this.effects = framework.effects;
        this.postProcessManager = framework.postProcessManager;
        this.timeManager = framework.timeManager;
        this.soundManager = framework.soundManager;
        this.particles = framework.particles;
    }

    /**
     * Gets the plugin.
     * @param { string } name 
     */
    protected getPlugin(name: string) : FrameworkPlugin
    {
        return this.framework.getPlugin(name);
    }

    /**
     * @brief Called when state is being initialized. Called only once, when state is being registered/added.
     * Ideally all assets for game state should be loaded here.
     */
    protected abstract onInitialize(): Promise<void>;

    /**
     * @brief Called when state is being destroyed.
     *
     */
    protected abstract onDestroy(): void;

    /**
     * @brief Transitions from current state, to new state.
     * State must be first added via AddState.
     *
     * @param { string } name - name of a state.
     */
    protected useState(name: string): void 
    {
        this.framework.useState(name);
    }

    /**
     * @brief Initialize the state. Called only once after state register.
     */
    public async initialize(): Promise<void>
    {
        if (this.m_state != LifecycleState.Initialized)
        {
            this.m_state = LifecycleState.Initialized;

            await this.onInitialize();
        }
    }

    /**
     * @brief Called when state is being entered. Can be called multiple times, after every transition into state.
     */
    public abstract onEnter(): void;

    /**
     * @brief Called when state is being updated. Called on each update.
     *
     * @param { number } delta_time - delta time in milliseconds.
     */
    public abstract onUpdate(delta_time: number): void;

    /**
     * @brief Called on each draw.
     */
    public abstract onDraw(): void;

    /**
     * @brief Called when state is being transitioned from. Can be called multiple times.
     */
    public abstract onExit(): void;

    /**
     * @brief Called when state is to be destroyed.
     */
    public destroy(): void 
    {
        if (this.m_state != LifecycleState.Destroyed)
        {
            this.m_state = LifecycleState.Destroyed;
            this.onDestroy();
        }
    }
}
