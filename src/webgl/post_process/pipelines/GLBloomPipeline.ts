import { Effect, IEffectFactory } from "../../../framework/bones_post_process";
import { IRenderer } from "../../../framework/bones_renderer";
import { PostProcessPipeline } from "../../../framework/post_process/pipelines/PostProcessPipeline";
import { ShaderUniformType } from "../../../framework/shaders/Shader";

import { WindowManager } from "../../../framework/Window";
import { GLExtractBrightColorFramebuffer } from "../../framebuffer/GLExtractBrightColorFramebuffer";
import { GLRenderFrameBuffer } from "../../framebuffer/GLRenderFrameBuffer";
import { GLScreenQuadGeometry } from "../../geometry/GLScreenQuadGeometry";

// Described here
// https://learnopengl.com/Advanced-Lighting/Bloom

// works by using hdr shader to extract image bright parts, bluring them and then combining with original image.

/**
 * The Bloom Pipeline.
 */
export class GLBloomPipeline extends PostProcessPipeline 
{
    // create two simple buffers for each pass. Avoids texture feedback if one buffers is used to read/write texture.
    private m_simpleFramebufferHorizontal: GLRenderFrameBuffer;
    private m_simpleFramebufferVertical: GLRenderFrameBuffer;

    // has normal scene and brightness texture
    private m_extractFramebuffer: GLExtractBrightColorFramebuffer;

    // two blur passes.
    private m_blurEffectHorizontal: Effect;
    private m_blurEffectVertical: Effect;



    private m_bloomBlendEffect: Effect;

    constructor(private m_windowManager: WindowManager, private m_renderer: IRenderer, private m_gl: WebGL2RenderingContext, private m_effectFactory: IEffectFactory)
    {
        super();
    }

    /**
     * @inheritdoc
     */
    public async initialize (): Promise<void>
    {
        // horizontal blur shader
        this.m_blurEffectHorizontal = await this.m_effectFactory.create(
            "assets/framework/shaders/effects/screen_v_es.glsl",
            "assets/framework/shaders/effects/guassian_blur/horizontal_guassian_blur_f_es.glsl", {
        });
        this.m_blurEffectHorizontal.initialize();
        const horizontal_blur_u = this.m_blurEffectHorizontal.shader.createUniform("u_blurSize", ShaderUniformType.Float);
        horizontal_blur_u.initialize();
        horizontal_blur_u.minValue = 0;
        horizontal_blur_u.maxValue = 5;
        horizontal_blur_u.value = 2.3;
        this.m_uniforms["horizontalBlurSize"] = horizontal_blur_u;

        // vertical blur shader
        this.m_blurEffectVertical = await this.m_effectFactory.create(
            "assets/framework/shaders/effects/screen_v_es.glsl",
            "assets/framework/shaders/effects/guassian_blur/vertical_guassian_blur_f_es.glsl", {
        });
        this.m_blurEffectVertical.initialize();
        const vertical_blur_u = this.m_blurEffectVertical.shader.createUniform("u_blurSize", ShaderUniformType.Float);
        vertical_blur_u.initialize();
        vertical_blur_u.minValue = 0;
        vertical_blur_u.maxValue = 2.3;
        vertical_blur_u.value = 1;
        this.m_uniforms["verticalBlurSize"] = vertical_blur_u;

        // combine shader.
        this.m_bloomBlendEffect = await this.m_effectFactory.create(
            "assets/framework/shaders/effects/screen_v_es.glsl",
            "assets/framework/shaders/effects/bloom/bloom_blend_f_es.glsl", {
        });
        this.m_bloomBlendEffect.initialize();
        const blur_factor_u = this.m_bloomBlendEffect.shader.createUniform("u_blurFactor", ShaderUniformType.Float);
        blur_factor_u.initialize();
        blur_factor_u.minValue = 0;
        blur_factor_u.maxValue = 5;
        blur_factor_u.value = 1.2;
        this.m_uniforms["blurFactor"] = blur_factor_u;

        // framebuffer with single tex
        this.m_simpleFramebufferHorizontal = new GLRenderFrameBuffer(this.m_windowManager, this.m_renderer, this.m_gl);
        await this.m_simpleFramebufferHorizontal.initialize();

        this.m_simpleFramebufferVertical = new GLRenderFrameBuffer(this.m_windowManager, this.m_renderer, this.m_gl);
        await this.m_simpleFramebufferVertical.initialize();

        // framebuffer that writes into 2 texture units.
        this.m_extractFramebuffer = new GLExtractBrightColorFramebuffer(this.m_windowManager, this.m_renderer, this.m_gl);
        await this.m_extractFramebuffer.initialize();
    }

    /**
     * @inheritdoc
     */
    public bind (): void
    {
        // write into buffer with 2 texture units. Normal colors and brightness colors.
        this.m_extractFramebuffer.bind();
    }

    public drawPass (): void
    {
        const gl = this.m_gl;

        // draw geometry.
        GLScreenQuadGeometry.instance.bind();

        // ----------------------- HORIZONTAL PASS

        // horizontal pass shader
        this.m_blurEffectHorizontal.use();

        // now get a texture from extract framebuffer, we need second texture, which is brightness pass texture
        const brightness_tex = this.m_extractFramebuffer.getBrightnessOutputTexture();

        // bind the buffer, so that it's renderer into it.
        this.m_simpleFramebufferHorizontal.bind();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // use brightness texture and do horizontal pass over it.
        // first use the shader.
        this.m_blurEffectHorizontal.shader.useSceneTexture(brightness_tex);

        // draw geometry.
        GLScreenQuadGeometry.instance.draw();

        // ----------------------- VERTICAL PASS

        // vertical pass shader.
        this.m_blurEffectVertical.use();

        // get the output texture from horizontal pass framebuffer.
        const horizontal_blur_tex = this.m_simpleFramebufferHorizontal.getOutputTexture(0);

        // bind the buffer, so that it's renderer into it.
        this.m_simpleFramebufferVertical.bind();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // use brightness texture and do horizontal pass over it.

        this.m_blurEffectVertical.shader.useSceneTexture(horizontal_blur_tex);

        // draw geometry.
        GLScreenQuadGeometry.instance.draw();

        // ---------------------- BLUR TEXTURE
        // get the output texture.
        const scene_texture = this.m_extractFramebuffer.getOutputTexture(0);
        const blur_texture = this.m_simpleFramebufferVertical.getOutputTexture(0);

        // back to canvas buffer.
        gl.bindTexture(gl.TEXTURE_2D, null); // this should generally not be necessary since we do not render to texture, but chrome is bit conservative in error messages. 
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // use the shader.
        this.m_bloomBlendEffect.use();

        // pass the scene texture to unit0
        this.m_bloomBlendEffect.shader.useSceneTexture(scene_texture);

        // does not have brightness texture, therefore set texture unit and bind texture
        this.m_bloomBlendEffect.shader.texture1 = blur_texture;
        this.m_bloomBlendEffect.shader.useTextureUnit1();

        // draw geometry.
        GLScreenQuadGeometry.instance.draw();
    }
}