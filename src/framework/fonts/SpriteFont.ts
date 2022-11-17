import { LifecycleState } from "../bones_common";
import { Vec2 } from "../bones_math";
import { Texture2D } from "../bones_texture";
import { Quad2D } from "../math/geometry/Quad2D";

/**
 * The type of font.
 */
export enum FontType 
{
    /**
     * Loaded as glyph texture, each char is a seperate texture.
     */
    GlyphCharFont,
    /**
     * Loaded as single bitmap, all font char are contained in single texture, with different texture coords.
     */
    BitmapFont 
}

/**
 * The font character
 */
export class FontCharacter
{
    /**
     * The state of a font character.
     */
    private m_state: LifecycleState = LifecycleState.Initialized;

    /**
     * The texture containing a font charater.
     */
    texture?: Texture2D;

    /**
     * The size of a font charater.
     */
    size?: Vec2;

    /**
     * The texture coordinates of a character.
     * This is only relevant when using Bitmap fonts.
     */
    textureCoords?: Quad2D;

    /**
     * Offset to advance to next glyph.
     */
    advance?: Vec2;

    /**
     * Destroy the font character.
     */
    public destroy() : void 
    {
        this.texture?.destroy();
        this.m_state = LifecycleState.Destroyed;
    }
}

class SpriteFontError extends Error 
{

}

export class SpriteFont 
{
    private readonly m_map: { [id: string]: FontCharacter };

    /**
     * The constructor.
     * @param { FontType } fontType - the type of a font.
     * @param { number } fontSize - the font size.
     */
    constructor(public readonly fontType: FontType,  public fontSize: number = 0)
    {
        this.m_map = {};
    }

    /**
     * Gets the texture of font, if font is loaded as bitmap.
     * This is only relevant for bitmap fonts.
     */
    public texture?: Texture2D;

    /**
     * Get the character info.
     * @param { string } char 
     * @returns { FontCharacter }
     */
    public getFontCharacterInfo (char: string): FontCharacter
    {
        return this.m_map[char];
    }

    /**
     * Creates the font character info. Puts it in map.
     * @param { string } char 
     * @param { FontCharacter } info  
     */
    public createFontCharacterInfo (char: string, info: FontCharacter): void 
    {
        if (this.m_map[char])
        {
            throw new SpriteFontError(`char ${char} is already assigned.`);
        }
        this.m_map[char] = info;
    }

    /**
     * Create or gets the font character info. Puts it in map if not already in.
     * @param { string } char 
     * @returns { FontCharacter }
     */
    public createOrGetFontCharacterInfo (char: string): FontCharacter 
    {
        if (!this.m_map[char])
        {
            this.m_map[char] = new FontCharacter();
        }
        return this.m_map[char];
    }

    /**
     * Destroy the font.
     */
    public destroy(): void 
    {
        for(const key in this.m_map)
        {
            this.m_map[key].destroy();
            delete this.m_map[key];
        }
    }
}

