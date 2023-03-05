import { GLEffectFactory } from "../webgl/GLPostProcessManager";
import { GL2Renderer } from "../webgl/GL2Renderer";
import { GLTextureManager } from "../webgl/GLTexture";
import { GLTextRenderer_Obsolete_2023_02_15 } from "../webgl/GLTextRenderer__Obsolete_";
import { Config } from "./bones_config";
import { InputManager } from "./input/InputManager";
import { FileLoader, ImageLoader } from "./bones_loaders";
import { IRenderer } from "./bones_renderer";
import { SpriteRenderer } from "./SpriteRenderer";
import { TextureManager } from "./bones_texture";
import { TextRenderManager } from "./TextRenderer";
import { TimeManager } from "./bones_time";
import { WindowManager } from "./Window";
import { State } from "./state/State";
import { SpriteFont } from "./fonts/SpriteFont";
import { SpriteFontManager } from "./fonts/SpriteFontManager";
import { WebGPURenderer } from "../webgpu/WebGPURenderer";
import { SoundManager } from "./sounds/SoundManager";
import { PostProcessManager, IEffectFactory } from "./bones_post_process";
import { ParticlesFactory } from "./particles/ParticlesFactory";
import { GLParticlesFactory } from "../webgl/particles/GLParticlesFactory";
import { FrameworkPlugin } from "./plugin/FrameworkPlugin";
import { WebGPUTextureManager } from "../webgpu/textures/WebGPUTextureManager";
import { PostProcessPipelineFactory } from "./post_process/pipelines/PostProcessPipelineFactory";
import { GLPipelineFactory } from "../webgl/post_process/pipelines/GLPipelineFactory";
import { GLPostProcessManager } from "../webgl/post_process/GLPostProcessManager";
import { GLSpriteRenderer } from "../webgl/renderers/sprite/GLSpriteRenderer";
import { GLLineRenderer2D } from "../webgl/renderers/lines/GLLineRenderer2D";
import { LineRenderer2D } from "./renderers/LineRenderer2D";
import { GLRectangleRenderer } from "../webgl/renderers/rectangle/GLRectangleRenderer";
import { RectangleRenderer } from "./renderers/RectangleRenderer";
import { GLEllipseRenderer } from "../webgl/renderers/ellipse/GLEllipseRenderer";
import { WebGPUSpriteRenderer } from "../webgpu/renderers/sprite/WebGPUSpriteRenderer";
import { GeometryBuffer } from "./GeometryBuffer";
import { GeometryBuilder } from "./geometry/GeometryBuilder";
import { Scene } from "./scene/Scene";
import { SceneManager } from "./scene/SceneManager";
import { MaterialManager } from "./material/manager/MaterialManager";
import { WebGPUMaterialManager } from "./material/manager/WebGPUMaterialManager";


export interface GameJoltCredentials 
{
    /**
     * The private key of a game.
     */
    privateKey: string;

    /**
     * The id of a game.
     */
    gameId: number;
}


/**
 * Which renderer to use.
 */
export enum UseRendererOption 
{
    WebGL2 = "webgl2",
    WebGPU = "webgpu"
}

/**
 * The framework options.
 */
export interface FrameworkOptions 
{
    /**
     * Which renderer to use.
     */
    renderer?: UseRendererOption | string;
}

/**
 * The framework.
 */
abstract class Framework
{
    /**
     * The {@link WebGL2RenderingContext} initialize by framework.
     * Only valid if WebGL2 rendering is used.
     */
    public static gl: WebGL2RenderingContext;

    private m_runFramework: boolean;

    /**
    * @brief The current state.
    */
    private m_currentState?: State;

    /**
     * @brief The map of states.
     */
    private readonly m_stateMap: { [id: string]: State } = {};

    /**
     * @brief The default font of framework.
     */
    protected m_defaultFont: SpriteFont;

    /**
     * The window manager. Usually responsible for working with whatever window is. In most cases, that will be HTMLCanvasElement.
     */
    public readonly window: WindowManager;

    /**
     * The renderer.
     */
    public readonly renderer: IRenderer;

    /**
     * The file loader.
     */
    public readonly fileLoader: FileLoader;

    /**
     * The image loader.
     */
    public readonly imageLoader: ImageLoader;

    /**
     * The texture manager.
     */
    public readonly textureManager: TextureManager;

    /**
     * The sprite renderer.
     */
    public readonly spriteRenderer: SpriteRenderer;

    /**
     * The line renderer.
     */
    public readonly lineRenderer2D: LineRenderer2D;

    /**
     * The rectangle renderer.
     */
    public readonly rectangleRenderer: RectangleRenderer;

    /**
     * The ellipse/circle renderer.
     */
    public readonly ellipseRenderer: GLEllipseRenderer;

    /**
     * The text render manager.
     */
    public readonly textRenderManager: TextRenderManager;

    /**
     * The font manager.
     */
    public readonly fontManager: SpriteFontManager;

    /**
     * The sound manager.
     */
    public readonly soundManager: SoundManager;

    /**
     * The config.
     */
    public readonly config: Config;

    /**
     * The input manager.
     */
    public readonly input: InputManager;

    /**
     * The time manager.
     */
    public readonly timeManager: TimeManager;

    /**
     * The post process manager.
     */
    public readonly postProcessManager: PostProcessManager;

    /**
     * The effects.
     */
    public readonly effects: IEffectFactory;

    /**
     * The pipeline factory.
     */
    public readonly postProcessPipelines: PostProcessPipelineFactory;

    /**
     * The particles factory.
     */
    public readonly particles: ParticlesFactory;

    /**
     * The geometry builder.
     */
    public readonly geometryBuilder: GeometryBuilder;

    /**
     * The framework plugins.
     */
    public readonly plugins: { [id: string]: FrameworkPlugin } = {};

    /**
     * The scene manager.
     */
    public readonly sceneManager: SceneManager;

    /**
     * All scenes added to framework.
     */
    public readonly scenes: Array<Scene> = [];

    /**
     * The material manager.
     */
    public readonly materialManager: MaterialManager;

    /**
     * The active scene, if greater or equal 0, tries to get scene from scenes.
     */
    public activeScene = -1;


    /**
     * The constructor.
     * @param { HTMLCanvasElement } canvas 
     */
    constructor(public readonly canvas: HTMLCanvasElement, options: FrameworkOptions)
    {
        this.window = new WindowManager(canvas);
        this.fileLoader = new FileLoader();
        this.imageLoader = new ImageLoader();
        this.soundManager = new SoundManager();
        this.input = new InputManager(canvas);
        this.config = new Config(this.fileLoader);
        this.timeManager = new TimeManager();
        this.geometryBuilder = new GeometryBuilder();
        this.sceneManager = new SceneManager(this);

        if (options?.renderer == UseRendererOption.WebGPU)
        {
            this.renderer = new WebGPURenderer(canvas, this);
            this.materialManager = new WebGPUMaterialManager(this);
            this.textureManager = new WebGPUTextureManager(this.renderer as WebGPURenderer, this.imageLoader);
            this.fontManager = new SpriteFontManager(this.textureManager, this.imageLoader);
            this.spriteRenderer = new WebGPUSpriteRenderer((this.renderer as WebGPURenderer).context);

            // TODO: temp
            this.renderer.spriteRenderer = this.spriteRenderer;
            (this.renderer as WebGPURenderer).textureManager = this.textureManager;
        }
        // by default WebGL2
        else
        {
            this.renderer = new GL2Renderer(canvas, this.window);
            const gl = (this.renderer as GL2Renderer).gl;
            Framework.gl = gl;
            this.textureManager = new GLTextureManager(gl, this.imageLoader);
            this.spriteRenderer = new GLSpriteRenderer(gl);
            this.renderer.spriteRenderer = this.spriteRenderer;
            // this.textRenderManager = new GLTextRenderer(gl, this.window, this.renderer, this.fileLoader);
            this.postProcessManager = new GLPostProcessManager(this.window, this.renderer, gl);
            this.effects = new GLEffectFactory(this.renderer, this.timeManager, this.fileLoader, this.textureManager, gl);
            this.fontManager = new SpriteFontManager(this.textureManager, this.imageLoader);
            this.particles = new GLParticlesFactory(gl, this.fileLoader, this.input, this.textureManager, this.window);
            this.postProcessPipelines = new GLPipelineFactory(this.window, this.renderer, gl, this.effects);

            // various renderers. Use factory to create one instead.
            this.lineRenderer2D = new GLLineRenderer2D(this);
            this.rectangleRenderer = new GLRectangleRenderer(this);
            this.ellipseRenderer = new GLEllipseRenderer(this);
        }
    }

    /**
     * The animation frame. Runs all loops.
     */
    private animationFrame (): void
    {
        if (this.m_runFramework)
        {
            this.timeManager.start();

            if (this.activeScene >= 0)
            {
                this.sceneManager.activeScene = this.scenes[this.activeScene];
            }

            this.input.update();

            // TODO: pass delta time
            const delta_time_ms = this.timeManager.time.deltaTimeMS;

            // main method, state, plugins
            this.update(delta_time_ms);
            this.m_currentState?.onUpdate(delta_time_ms);
            for (let key in this.plugins)
            {
                this.plugins[key].update(delta_time_ms);
            }
            this.sceneManager.update(delta_time_ms);

            // afterUpdate is always after all update loops.
            this.input.afterUpdate();
            // END UPDATE CODE


            // DRAW CODE
            this.renderer.beginDraw();

            // main method, state, plugins
            this.draw();
            this.m_currentState?.onDraw();
            for (let key in this.plugins)
            {
                this.plugins[key].draw();
            }
            this.sceneManager.draw();
            this.renderer.endDraw();
            // END DRAW CODE

            requestAnimationFrame(this.animationFrame.bind(this));
        }
    }

    /**
     * @brief Adds the state to be used by framework.
     *
     * @param { string } name - name of a state.
     * @param { State } state - state to register.
     * @returns {  Promise<void> }
     */
    protected addState (name: string, state: State): Promise<void> 
    {
        if (this.m_stateMap[name])
        {
            this.m_stateMap[name].destroy();
        }

        this.m_stateMap[name] = state;
        return state.initialize();
    }

    /**
     * @brief Remove the state under name.
     *
     * @param { string } name - name of a state.
     * @returns { void }
     */
    protected removeState (name: string): void 
    {
        if (this.m_stateMap[name])
        {
            this.m_stateMap[name].destroy();
        }
        delete this.m_stateMap[name];
    }

    /**
     * Gets the framework plugin.
     * @param { string } name
     * @returns { FrameworkPlugin | undefined} 
     */
    public getPlugin (name: string): FrameworkPlugin | undefined
    {
        return this.plugins[name];
    }

    /**
     * Adds new framework plugin.
     * @param { string } name 
     * @param { FrameworkPlugin } plugin - plugin instance. 
     */
    protected addPlugin (name: string, plugin: FrameworkPlugin): FrameworkPlugin 
    {
        if (this.plugins[name])
        {
            throw new Error(`Framework::addPlugin: Plugin '${name}' already added!`);
        }
        this.plugins[name] = plugin;
        return plugin;
    }

    /**
     * Setups the framework. 
     * To override if there are any plugins to be registered.
     */
    public setup (): void 
    {

    }

    /**
     * Initialize the framework.
     */
    public async initializeFramework (): Promise<void>
    {
        this.m_runFramework = true;

        await this.renderer.initialize();
        this.materialManager?.initialize();
        this.textureManager?.initialize();
        await this.spriteRenderer?.initialize();
        // await this.textRenderManager?.initialize();
        await this.config.initialize();
        this.fontManager?.initialize();
        await this.postProcessManager?.initialize();
        await this.lineRenderer2D?.initialize();
        await this.rectangleRenderer?.initialize();
        await this.ellipseRenderer?.initialize();
        await this.sceneManager.initialize();

        // this.inputManager.initialize();

        this.m_defaultFont = this.fontManager?.defaultFont;

        // first call setup, so that plugins can be registered.
        this.setup();

        // setup plugins
        for (let key in this.plugins)
        {
            this.plugins[key].setup(this);
        }

        // initialize.
        await this.initialize();

        for (let key in this.plugins)
        {
            await this.plugins[key].initialize();
        }
    }

    /**
     * @brief Starts the update and render loop.
     */
    public runFrameworkLoops (): void 
    {
        requestAnimationFrame(this.animationFrame.bind(this));
    }

    /**
     * @brief Stops the framework and releases all the resources.
     */
    public stopFramework (): void 
    {
        this.m_runFramework = false;
    }

    /**
     * @brief Destroys the framework and all of it's resources.
     */
    public destroyFramework (): void 
    {
        // Destroy all the manager/variables that implement destroy.
        this.renderer.destroy();
        this.spriteRenderer.destroy();
        //  this.textRenderManager.destroy();
    }

    //#region Abstract Method. Must be initialized when overriden.

    /**
     * @brief Transitions from current state, to new state.
     * State must be first added via AddState.
     *
     * @param { string } name - name of a state.
     * @returns { void }
     */
    public useState (name: string): void 
    {
        if (this.m_currentState)
        {
            this.m_currentState.onExit();
        }
        this.m_currentState = this.m_stateMap[name];
        this.m_currentState.onEnter();
    }

    /**
     * Callback where assets and components should be initialized.
     */
    public abstract initialize (): Promise<void>;

    /**
     * The update methd.
     * @param { number } delta_time - delta time in milliseconds.
     * @returns { void }
     */
    public abstract update (delta_time: number): void;

    /**
     * The draw method. Always override the draw method in order to draw assets.
     */
    public abstract draw (): void;

    //#endregion
}

export
{
    Framework
}