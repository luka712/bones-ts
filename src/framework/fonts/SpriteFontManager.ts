import { CbfgFontLoader } from "./CbfgFontLoader";
import { ImageLoader } from "../bones_loaders";
import { Vec2 } from "../bones_math";
import { TextureManager } from "../bones_texture";
import { FontCharacter, FontType, SpriteFont } from "./SpriteFont";

export class SpriteFontManager 
{
    /**
     * The default font provided by SpriteFontManager.
     */
    public defaultFont: SpriteFont;

    /**
     * The specific font loader.
     */
    private m_cbfgFontLoader: CbfgFontLoader;

    /**
     * The constructor.
     * @param { TextureManager } m_textureManager 
     */
    constructor(private readonly m_textureManager: TextureManager, private readonly m_imageLoader: ImageLoader)
    {
        this.m_cbfgFontLoader = new CbfgFontLoader(m_imageLoader, m_textureManager);
    }

    /**
     * Initialize the sprite font manager.
     * @returns { void }
     */
    public initialize (): void 
    {
        this.defaultFont = this.createFont();
    }

    /**
     * Creates the sprite font using 2d canvas context.
     * 
     * @param { string } font - any standard css font that can be used by 2d context of canvas element. @see https://developer.mozilla.org/en-US/docs/Web/CSS/font . By default se to '48px sans-serif'.
     * @param { number } size - font size. By default set to 24. Larger font results in clearer text, but larger textures.
     */
    public createFont (font: string = '24px sans-serif', size: number = 24): SpriteFont
    {
        const result = new SpriteFont(FontType.GlyphCharFont, size);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        for (let i = 0; i < 128; i++)
        {
            let char = String.fromCharCode(i);

            ctx.canvas.width = size;
            ctx.canvas.height = size;
            ctx.font = font;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "white";
            ctx.scale(1, 1);
            ctx.clearRect(0, 0, size, size);
            ctx.fillText(char, size / 2, size / 2);

            const font_char = new FontCharacter();
            font_char.texture = this.m_textureManager.createTexture(canvas, size, size);
            font_char.size = new Vec2(size, size);

            result.createFontCharacterInfo(char, font_char);
        }

        canvas.remove();

        return result;
    }

    /**
     * Loads a custom font and creates font to be used by framework.
     * @param { string } family - name of font family.
     * @param { string } font_path - path to font.
     * @param { number | undefined } size - optional size parameter. Each char will be of passed size. 
     * @returns { Promise<SpriteFont> }
     */
    public async loadAndCreateFont (family: string, font_path: string, size: number = 48): Promise<SpriteFont>
    {
        // first load new font and add it to document
        const font = new FontFace(family, `url(${font_path})`);
        await font.load();
        document.fonts.add(font);

        // result
        const result = new SpriteFont(FontType.GlyphCharFont, size);

        // create canvas that will load font chars
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // for each ASCII char
        for (let i = 0; i < 128; i++)
        {
            let char = String.fromCharCode(i);

            // describe char
            ctx.canvas.width = size;
            ctx.canvas.height = size;
            ctx.font = `${size * 2}px ${family}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "white";
            ctx.scale(1, 1);
            ctx.clearRect(0, 0, size, size);
            ctx.fillText(char, size / 2, size / 2);

            // create charater and texture for it.
            const font_char = new FontCharacter();
            font_char.texture = this.m_textureManager.createTexture(canvas, size, size);
            font_char.size = new Vec2(size, size);

            result.createFontCharacterInfo(char, font_char);
        }

        // remove canvas.
        canvas.remove();

        return result;
    }


    /**
     * Loads a bitmap font. 
     * @param { string } family - name of font family.
     * @param { string } font_path - path to font.
     * @param { number | undefined } size - optional size parameter. Each char will be of passed size. 
     * @returns { Promise<SpriteFont> }
     */
    public loadBitmapFont (bitmap_path: string, data_path: string): Promise<SpriteFont> 
    {
        return this.m_cbfgFontLoader.loadFont(bitmap_path, data_path);
    }

    /**
     * Destroy the font manager.
     */
    public destroy (): void 
    {
        this.defaultFont.destroy();
    }
}