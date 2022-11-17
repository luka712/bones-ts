import { Rect, Vec2 } from "../framework/bones_math";
import { Texture2D } from "../framework/bones_texture";
import { SpriteFont } from "../framework/fonts/SpriteFont";
import { SpriteRenderer } from "../framework/SpriteRenderer";
import { TextRenderManager } from "../framework/TextRenderer";

/**
 * The text component.
 * Draws simple text with icon on screen.
 */
export class TextComponent 
{

    private o_drawRect: Rect;
    private o_textPosition: Vec2;
    private o_offsetX: number;
    private o_offsetY: number;

    /**
     * The scale of a font and icon.
     */
    private m_scale: number;


    /**
     * Gets the scale of font and icon.
     */
    public get scale (): number 
    {
        return this.m_scale;
    }

    /**
     * Sets the scale of font and icon.
     */
    public set scale (v: number) 
    {
        this.m_scale = v;
        this.o_drawRect.w = this.m_font.fontSize * this.scale;
        this.o_drawRect.h = this.m_font.fontSize * this.scale;
        this.o_textPosition[0] = this.m_font.fontSize * this.scale + this.m_position.x + this.o_offsetX;
        this.o_textPosition[1] = this.m_position.y + this.o_offsetY;
    }

    /**
     * If there is need to offset icon from initial position.
     */
    public iconOffset: Vec2 = Vec2.zero();

    /**
     * The constructor.
     * 
     * @param { SpriteRenderer } m_spriteRenderer 
     * @param { TextRenderManager } m_textRenderer 
     * @param { SpriteFont } m_font 
     * @param { string } m_text 
     * @param { Texture2D } m_icon 
     * @param { Vec2 } m_position 
     */
    constructor(private m_spriteRenderer: SpriteRenderer,
        private m_textRenderer: TextRenderManager,
        private m_font: SpriteFont,
        private m_text: string,
        private m_icon: Texture2D,
        private m_position: Vec2)
    {
        this.o_drawRect = new Rect();
        this.o_drawRect.x = m_position.x - m_font.fontSize;
        this.o_drawRect.y = m_position.y - m_font.fontSize / 2;
        this.o_drawRect.w = m_font.fontSize * 2;
        this.o_drawRect.h = m_font.fontSize * 2;

        this.o_offsetX = 0;
        this.o_offsetY = 0;
        this.o_textPosition = new Vec2(m_font.fontSize + m_position.x + this.o_offsetX, m_position.y + this.o_offsetY);

        this.scale = 1;
    }


    /**
     * Draw the component.
     */
    public draw (): void  
    {
        this.o_drawRect.x = this.m_position.x + this.iconOffset.x;
        this.o_drawRect.y = this.m_position.y + this.iconOffset.y;

        this.m_spriteRenderer.begin();
        this.m_spriteRenderer.draw(this.m_icon, this.o_drawRect);
        this.m_spriteRenderer.end();

        this.m_textRenderer.begin();
        this.m_textRenderer.drawString(this.m_font, this.m_text, this.o_textPosition, this.m_scale);
        this.m_textRenderer.end();
    }
}