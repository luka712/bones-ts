import { ImageLoader } from "../bones_loaders";
import { Vec2 } from "../bones_math";
import { TextureManager } from "../bones_texture";
import { FontType, SpriteFont } from "./SpriteFont";
import { Quad2D } from "../math/geometry/Quad2D";

/**
 * Loads the fonts created by Codehead's Bitmap Font Generator.
 * @see https://github.com/CodeheadUK/CBFG
 */
export class CbfgFontLoader 
{
    /**
     * The constructor. Parse Codehead's Bitmap Font Generator format 
     * @see http://www.codehead.co.uk/cbfg/
     * @param { ImageLoader } m_imageLoader 
     * @param { TextureManager } m_textureManager 
     */
    constructor(private m_imageLoader: ImageLoader, private m_textureManager: TextureManager)
    {

    }

    /**
     * Loads a bitmap font, created by Cbfg tool.
     * @see https://github.com/CodeheadUK/CBFG
     * @param { HTMLImageElement|string } bitmap - bitmap path or HTMLImageElement
     * @param { string } data - path to data file(csv) or csv source.
     * @returns { Promise<SpriteFont> }
     */
    public async loadFont (bitmap: HTMLImageElement | string, data: string): Promise<SpriteFont>
    {
        if (typeof bitmap === "string")
        {
            bitmap = await this.m_imageLoader.loadImage(bitmap);
        }
        if(data.indexOf(".csv") > 0)
        {
            data = await (await fetch(data)).text();
        }

        const font = new SpriteFont(FontType.BitmapFont, 0);

        // create canvas that will load font chars
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // load texture, draw it to canvas, create gl texture, remove canvas.
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        ctx.drawImage(bitmap, 0, 0);
        font.texture = await this.m_textureManager.createTexture(canvas, bitmap.width, bitmap.height);
        canvas.remove();

        // cells size.
        let cell_size_x = 0;
        let cell_size_y = 0;

        // go through each line.
        const lines = (await data).split("\n");
        const count = lines.length;
        for (let i = 0; i < count; i++)
        {
            const line = lines[i];

            if (line.startsWith("Char"))
            {
                const split_line = line.split(" ");
                const char_n = Number(split_line[1]);
                const char = String.fromCharCode(char_n);

                const char_info = font.createOrGetFontCharacterInfo(char);
                char_info.size = new Vec2(font.fontSize, font.fontSize);

                // if --- Base Width
                const comma_split = split_line[3].split(",");
                if (split_line[2] == "Base" && comma_split[0] == "Width")
                {
                    const width = Number(comma_split[1]);
                    char_info.size = new Vec2(font.fontSize, font.fontSize);
                    char_info.advance = new Vec2(width, 0);
                }

            }
            else if (line.startsWith("Font Height,"))
            {
                const str = line.substring(12);
                font.fontSize = Number(str);
            }
            else if (line.startsWith("Cell Width,"))
            {
                const str = line.substring(11);
                cell_size_x = Number(str);
            }
            else if (line.startsWith("Cell Height,"))
            {
                const str = line.substring(12);
                cell_size_y = Number(str);
            }
        }

        let x = 0;
        let y = 0;

        const cell_size_x_norm = cell_size_x / bitmap.width;
        const cell_size_y_norm = cell_size_y / bitmap.height;

        // for each ASCII char
        for (let i = 0; i < 128; i++)
        {
            // now get ascii chars.
            const ascii = String.fromCharCode(i);
            const ch = font.createOrGetFontCharacterInfo(ascii);

            // find texture coordinates.
            const tx = x / bitmap.width;
            const ty = y / bitmap.height;

            ch.textureCoords = new Quad2D(
                new Vec2(tx, ty), // tl
                new Vec2(tx, ty + cell_size_y_norm), // tr
                new Vec2(tx + cell_size_x_norm, ty + cell_size_y_norm), // bl
                new Vec2(tx + cell_size_x_norm, ty), // br
            );

            // advance x and y
            x += cell_size_x;
            if (x >= bitmap.width)
            {
                x = 0;
                y += cell_size_y;
            }
        }


        return font;
    }
}