
import { Framework, TextureManager } from "../..";
import { Vec2 } from "../bones_math";
import { FontType, SpriteFont } from "../fonts/SpriteFont";
import { Quad2D } from "../math/geometry/Quad2D";

/**
 * Loads the fonts created by Codehead's Bitmap Font Generator.
 * @see https://snowb.org/
 */
export class SnowBFontLoader {
    /**
     * The constructor. Parse Codehead's Bitmap Font Generator format 
     * @see http://www.codehead.co.uk/cbfg/
     * @see {@link Framework }
     */
    constructor(private readonly m_framework: Framework) {

    }

    /**
     * Loads a bitmap font, created by SnowB tool.
     * @see https://snowb.org/
     * @param { HTMLImageElement|string } bitmap - bitmap path or HTMLImageElement
     * @param { string } dataOrFilePath - path to data file(xml) or xml source.
     * @returns { Promise<SpriteFont> }
     */
    public async loadFont (bitmap: HTMLImageElement | string, dataOrFilePath: string): Promise<SpriteFont> {
        if (typeof bitmap === "string") {
            bitmap = await this.m_framework.imageLoader.loadImage(bitmap);
        }
        if (dataOrFilePath.indexOf(".xml") > 0) {
            dataOrFilePath = await (await fetch(dataOrFilePath)).text();
        }


        // Create parser for xml 
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(dataOrFilePath, "text/xml");

        const lineHeight = parseInt(xmlDoc.querySelector("common")!.getAttribute("lineHeight")!);

        const font = new SpriteFont(FontType.BitmapFont, lineHeight);
        const texture = await this.m_framework.textureManager.createTexture(bitmap);
        font.texture = texture;

        xmlDoc.querySelectorAll("char").forEach((char) => {

            const id = parseInt(char.getAttribute("id")!);

            const x = parseInt(char.getAttribute("x")!);
            const y = parseInt(char.getAttribute("y")!);
            const width = parseInt(char.getAttribute("width")!);
            const height = parseInt(char.getAttribute("height")!);
            const xOffset = parseInt(char.getAttribute("xoffset")!);
            const yOffset = parseInt(char.getAttribute("yoffset")!);
            const xAdvance = parseInt(char.getAttribute("xadvance")!);

            const x1 = x / texture.width;
            const y1 = y / texture.height;
            const x2 = (x + width) / texture.width;
            const y2 = (y + height) / texture.height;

            const quad = new Quad2D(
                Vec2.fromValues(x1, y1),
                Vec2.fromValues(x2, y1),
                Vec2.fromValues(x2, y2),
                Vec2.fromValues(x1, y2),
            );

            const ascii = String.fromCharCode(id);
            const ch = font.createOrGetFontCharacterInfo(ascii);

            ch.advance = xAdvance;
            ch.size = Vec2.fromValues(width, height);
            ch.offset = Vec2.fromValues(xOffset, yOffset);
            ch.textureCoords = quad;
        });


        return font;
    }
}