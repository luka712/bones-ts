import { LifecycleState } from "../bones_common";
import { Vec2 } from "../bones_math";
import { Quad2D } from "../math/geometry/Quad2D";
import { Texture2D } from "../textures/Texture2D";

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
export class SpriteFontCharacter
{
    // #region Properties (6)

    /**
     * The state of a font character.
     */
    private m_state: LifecycleState = LifecycleState.Initialized;

    /**
     * The advance of the character.
     */
    public advance = 0;
    /**
     * The offset of the character.
     */
    public offset = Vec2.zero();
    /**
     * The size of a font charater.
     */
    size?: Vec2;
    /**
     * The texture containing a font charater.
     */
    texture?: Texture2D;
    /**
     * The texture coordinates of a character.
     * This is only relevant when using Bitmap fonts.
     */
    textureCoords?: Quad2D;

    // #endregion Properties (6)

    // #region Public Methods (1)

    /**
     * Destroy the font character.
     */
    public destroy() : void 
    {
        this.texture?.destroy();
        this.m_state = LifecycleState.Destroyed;
    }

    // #endregion Public Methods (1)
}

class SpriteFontError extends Error 
{
}

export class SpriteFont 
{
    // #region Properties (2)

    private readonly m_map: { [id: string]: SpriteFontCharacter };

    /**
     * Gets the texture of font, if font is loaded as bitmap.
     * This is only relevant for bitmap fonts.
     */
    public texture?: Texture2D;

    // #endregion Properties (2)

    // #region Constructors (1)

    /**
     * The constructor.
     * @param { FontType } fontType - the type of a font.
     * @param { number } fontSize - the font size.
     */
    constructor(public readonly fontType: FontType,  public fontSize: number = 0)
    {
        this.m_map = {};
    }

    // #endregion Constructors (1)

    // #region Public Methods (6)

    /**
     * Creates the font character info. Puts it in map.
     * @param { string } char 
     * @param { SpriteFontCharacter } info  
     */
    public createFontCharacterInfo (char: string, info: SpriteFontCharacter): void 
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
     * @returns { SpriteFontCharacter }
     */
    public createOrGetFontCharacterInfo (char: string): SpriteFontCharacter 
    {
        if (!this.m_map[char])
        {
            this.m_map[char] = new SpriteFontCharacter();
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

    /**
     * Get the sprite font character info.
     * @param char
     * @returns @see {@link SpriteFontCharacter }
     */
    public getChar (char: string): SpriteFontCharacter
    {
        return this.m_map[char];
    }

    /**
     * Measures the font text.
     * @param text - the text to measuer.
     */
    public measureText(text: string) : Vec2 
    {
        return new Vec2(this.measureTextHorizontal(text), this.m_map["0"].size.y);
    }

    /**
     * Measures the text horizontally.
     * @param text - the text to measure.
     * @returns text length in pixels horizontally.
     */
    public measureTextHorizontal(text: string) : number 
    {
        let len = 0;
        for(let i = 0; i < text.length; i++)
        {
            const c = this.getChar(text[i]);
            len += c.size.x;
        }

        return len;
    }

    // #endregion Public Methods (6)
}
