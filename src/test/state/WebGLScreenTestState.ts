import { Vec2, Rect } from "../../framework/bones_math";
import { Effect } from "../../framework/bones_post_process";
import { Texture2D } from "../../framework/bones_texture";
import { SpriteFont } from "../../framework/fonts/SpriteFont";
import { Framework } from "../../framework/Framework";
import { ParticlesEmitter } from "../../framework/particles/ParticlesEmitter";
import { State } from "../../framework/state/State";

export class WebGLScreenTestState extends State 
{
    //#region  Does nothing
    protected onDestroy (): void
    {
        // throw new Error("Method not implemented.");
    }
    public onEnter (): void
    {
        // throw new Error("Method not implemented.");
    }
    public onExit (): void
    {
        // throw new Error("Method not implemented.");
    }
    //#endregion
   
    private emitter: ParticlesEmitter;

    private m_testTexture: Texture2D;

    private m_testBitmapFont: SpriteFont;

    private m_testEffect: Effect;

    constructor(framework: Framework)
    {
        super(framework);
    }

    public async onInitialize (): Promise<void>
    {
        this.emitter = this.particles.createParticlesEmitter();
        await this.emitter.initialize();

        this.m_testTexture = await this.textureManager.loadTexture2D("assets/framework/textures/test/texture-mapping-test-image.jpg");

        // load font
        this.m_testBitmapFont = await this.fontManager.loadBitmapFont(
            "assets/framework/fonts/cbfg/TheleahFat.bmp", 
            "assets/framework/fonts/cbfg/TheleahFat.csv");

        //	m_testEffect = Effects->CreateGrayScaleEffect();
        //	m_testEffect = Effects->CRTEffect();
        this.m_testEffect = await this.effects.crtEffect();
        this.m_testEffect.initialize();
    }

    public onUpdate (delta_time: number): void
    {
        // this.particleManager.update(delta_time);
        this.emitter.update(delta_time);
    }
    public onDraw (): void
    {
        this.postProcessManager.beforeRender(this.m_testEffect);

        // TODO: 
        //rename textRenderManager to textRenderer
        this.textRenderer.begin();

        const ms_passed = this.timeManager.time.deltaTimeMS;
        const fps = this.timeManager.fps;
        this.textRenderer.drawString(this.fontManager.defaultFont, "Glyphs font test: Test 12345", Vec2.zero(), 0.25);
        this.textRenderer.drawString(this.m_testBitmapFont, "Bitmap font test: Test 12345", new Vec2(0, 20), 0.35);


        this.textRenderer.drawString(this.m_testBitmapFont, "MS Test: " + ms_passed, new Vec2(0, 48), 0.35);
        this.textRenderer.drawString(this.m_testBitmapFont, "FPS Test: " + fps, new Vec2(0, 72), 0.35);


        this.textRenderer.drawString(this.m_testBitmapFont, "Texture test. One drawn with 4 source rects, 1 drawn hole ", new Vec2(0.0, 64 * 3 + 10), 0.35);

        this.textRenderer.end();

        // test texture coordinates
        this.spriteRenderer.begin();
        const half_texture_size = this.m_testTexture.width / 2.0;

        // top left 
        this.spriteRenderer.drawSource(this.m_testTexture, new Rect(0, 64 * 4, 64, 64), new Rect(0, 0, half_texture_size, half_texture_size));

        // top right
        this.spriteRenderer.drawSource(this.m_testTexture, new Rect(64, 64 * 4, 64, 64), new Rect(half_texture_size, 0, half_texture_size, half_texture_size));

        // bottom left 
        this.spriteRenderer.drawSource(this.m_testTexture, new Rect(0, 64 * 5, 64, 64), new Rect(0, half_texture_size, half_texture_size, half_texture_size));

        // bottom right
        this.spriteRenderer.drawSource(this.m_testTexture, new Rect(64, 64 * 5, 64, 64), new Rect(half_texture_size, half_texture_size, half_texture_size, half_texture_size));

        this.spriteRenderer.draw(this.m_testTexture, new Rect(132, 64 * 4, 128, 128));


        this.spriteRenderer.end();

        this.emitter.draw();


        this.postProcessManager.afterRender();
    }

}