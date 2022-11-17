import { LifecycleState } from "../framework/bones_common";
import { FileLoader } from "../framework/bones_loaders";
import { Vec2 } from "../framework/bones_math";
import { Effect, IEffectFactory, PostProcessManager } from "../framework/bones_post_process";
import { IRenderer } from "../framework/bones_renderer";
import { Texture2D, TextureManager, TextureWrap } from "../framework/bones_texture";
import { TimeManager } from "../framework/bones_time";
import { WindowManager } from "../framework/Window";
import { Vec3 } from "../framework/math/vec/Vec3";
import { GLRenderFrameBuffer } from "./webgl_framebuffer";
import { ShaderUniformType } from "../framework/shaders/Shader";
import { GLEffectShader } from "./shaders/GLEffectShader";


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
        this.m_frameBuffer = new GLRenderFrameBuffer(window_manager, renderer, gl);
        this.m_renderer = renderer;
    }

    public initialize (): void
    {
        if (this.m_state != LifecycleState.Initialized)
        {
            this.m_frameBuffer.initialize(); 
        }
        this.m_state = LifecycleState.Initialized;
    }

}

/**
 * Create the GL effects options.
 */
class CreateGLEffectOptions 
{
    public texture0?: Texture2D;
    public texture1?: Texture2D;
    public texture2?: Texture2D;
    public texture3?: Texture2D;
}

class GLEffectFactory implements IEffectFactory 
{
    /**
     * Construct the GL effect factory.
     * @param { IRenderer } m_renderer 
     * @param { TimeManager } m_timeManager 
     * @param { FileLoader } m_fileLoader 
     * @param { TextureManager } m_textureManager 
     * @param { WebGL2RenderingContext } m_gl 
     */
    constructor(private m_renderer: IRenderer,
        private m_timeManager: TimeManager,
        private m_fileLoader: FileLoader,
        private m_textureManager: TextureManager,
        private m_gl: WebGL2RenderingContext)
    {

    }

    /**
     * Create one effect.
     * @param { string } vertex_path 
     * @param { string } fragment_path 
     */
    private async create (vertex_path: string, fragment_path: string, options?: CreateGLEffectOptions): Promise<Effect>
    {
        const v_source = await this.m_fileLoader.loadFile(vertex_path);
        const f_source = await this.m_fileLoader.loadFile(fragment_path);
        const shader = new GLEffectShader(this.m_gl, v_source, f_source);
        if (options?.texture1)
        {
            shader.texture1 = options.texture1;
        }
        if (options?.texture2)
        {
            shader.texture2 = options.texture2;
        }
        if (options?.texture3)
        {
            shader.texture3 = options.texture3;
        }

        return new Effect(this.m_renderer, this.m_timeManager, shader);
    }

    /**
   * @brief Create a Gray Scale Effect object.
   *
   * @return { Promise<Effect> }
   */
    public createGrayScaleEffect (): Promise<Effect>
    {
        return this.create("assets/framework/shaders/effects/grayscale_v_es.glsl", "assets/framework/shaders/effects/grayscale_f_es.glsl")
    }

    /**
     * @brief Create a Orderer Dithering Effect object.
     *
     * @return { Promise<Effect> }
     */
    public orderedDitheringEffect (): Promise<Effect>
    {
        return this.create("assets/framework/shaders/effects/ordered_dither_v_es.glsl", "assets/framework/shaders/effects/ordered_dither_f_es.glsl")
    }

    /**
     * @brief Create the chromatic aberration effect.
     *
     * @return { Promise<Effect> }
     */
    public chromaticAberrationEffect (): Promise<Effect>
    {
        return this.create("assets/framework/shaders/effects/chromatic_aberration_v_es.glsl", "assets/framework/shaders/effects/chromatic_aberration_f_es.glsl");
    }

    /**
     * @brief Create the chromatic aberration effect.
     *
     * @return { Promise<Effect> }
     */
    public async crtEffect (): Promise<Effect>
    {
        const texture1 = await this.m_textureManager.loadTexture2D("assets/framework/textures/crt/scanlines.png", "crt_scanlines", {
            textureWrap: TextureWrap.Repeat
        });

        const texture2 = await this.m_textureManager.loadTexture2D("assets/framework/textures/crt/vignette.png", "crt_vignette");

        const texture3 = await this.m_textureManager.loadTexture2D("assets/framework/textures/crt/perlin.png", "crt_perlin", {
            textureWrap: TextureWrap.Repeat
        });


        const effect = await this.create("assets/framework/shaders/effects/crt/crt_v_es.glsl", "assets/framework/shaders/effects/crt/crt_f_es.glsl", {
            texture1: texture1,
            texture2: texture2,
            texture3: texture3
        });

        const red_offset_uniform = effect.shader.createUniform("u_redOffset", ShaderUniformType.Vec2);
        red_offset_uniform.value = new Vec2(-0.004, 0);
        red_offset_uniform.minValue = new Vec2(-0.01, -0.01);
        red_offset_uniform.maxValue = new Vec2(0.01, 0.01);

        const green_offset_uniform = effect.shader.createUniform("u_greenOffset", ShaderUniformType.Vec2);
        green_offset_uniform.minValue = new Vec2(-0.01, -0.01);
        green_offset_uniform.maxValue = new Vec2(0.01, 0.01);

        const blue_offset_uniform = effect.shader.createUniform("u_blueOffset", ShaderUniformType.Vec2);
        blue_offset_uniform.value = new Vec2(0.004, 0);
        blue_offset_uniform.minValue = new Vec2(-0.01, -0.01);
        blue_offset_uniform.maxValue = new Vec2(0.01, 0.01);

        const bend_factor_uniform = effect.shader.createUniform("u_bendFactor", ShaderUniformType.Float);
        bend_factor_uniform.value = 4;
        bend_factor_uniform.maxValue = 5;
        bend_factor_uniform.minValue = 3;

        const scanline_speed_uniform = effect.shader.createUniform("u_scanlineSpeed", ShaderUniformType.Float);
        scanline_speed_uniform.value = -0.08;
        scanline_speed_uniform.maxValue = 0.2;
        scanline_speed_uniform.minValue = -0.2;

        const scanline_mix_uniform = effect.shader.createUniform("u_scanlineMixStrength", ShaderUniformType.Float);
        scanline_mix_uniform.value = 0.05;

        const noise_mix_uniform = effect.shader.createUniform("u_noiseMixStrength", ShaderUniformType.Float);
        noise_mix_uniform.value = 0.05;

        return effect;
    }

    /**
     * Uses weighted color from framebuffer texture ( texture unit 0) as input texture coordinate for second texture ( texture unit 0).
     * Then texel from second texture at position with x and y being weighted color, is used as final output.
     * For example.
     * For weighted color of 0.25, output is texel at position (0.25, 0.25) of second texture.   
     * 
     * @return { Promise<Effect> }
     */
    public async texelColorEffect(): Promise<Effect>
    {
        const texture1 = await this.m_textureManager.loadTexture2D("assets/framework/textures/texel_color/gameboy_colors.png", "texel_color_input_texture", {
            textureWrap: TextureWrap.Repeat
        });


        const effect = await this.create(
            "assets/framework/shaders/effects/texel_color/texel_color_v_es.glsl",
            "assets/framework/shaders/effects/texel_color/texel_color_f_es.glsl", {
            texture1: texture1
        });

        const weights = effect.shader.createUniform("u_weights", ShaderUniformType.Vec3);
        weights.value = new Vec3(0.2126, 0.7152, 0.0722);
        weights.minValue = Vec3.zero();
        weights.maxValue = Vec3.one();

        return effect;
    }

}

export 
{
    GLEffectFactory
}