
import { Framework, TextureManager } from "../..";
import { Vec2 } from "../bones_math";
import { FontType, SpriteFont } from "../fonts/SpriteFont";
import { Quad2D } from "../math/geometry/Quad2D";
import { ImageLoader } from "./ImageLoader";

/**
 * Loads the fonts created by Codehead's Bitmap Font Generator.
 * @see https://github.com/CodeheadUK/CBFG
 */
export class CbfgFontLoader 
{
    /**
     * The constructor. Parse Codehead's Bitmap Font Generator format 
     * @see http://www.codehead.co.uk/cbfg/
     * @param @see {@link Framework } m_framework

     */
    constructor(private readonly m_framework: Framework)
    {

    }

    /**
     * Loads a bitmap font, created by Cbfg tool.
     * @see https://github.com/CodeheadUK/CBFG
     * @param { HTMLImageElement|string } bitmap - bitmap path or HTMLImageElement
     * @param { string } data_or_file_path - path to data file(csv) or csv source.
     * @returns { Promise<SpriteFont> }
     */
    public async loadFont (bitmap: HTMLImageElement | string, data_or_file_path: string): Promise<SpriteFont>
    {
        if (typeof bitmap === "string")
        {
            bitmap = await this.m_framework.imageLoader.loadImage(bitmap);
        }
        if(data_or_file_path.indexOf(".csv") > 0)
        {
            data_or_file_path = await (await fetch(data_or_file_path)).text();
        }

        const font = new SpriteFont(FontType.BitmapFont, 0);

        // create canvas that will load font chars
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // load texture, draw it to canvas, create gl texture, remove canvas.
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;

        ctx.drawImage(bitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const red = data[i]; 
            const green = data[i + 1];
            const blue = data[i + 2]; 

            if(red == 0 && green == 0 && blue == 0)
            {
                // set alpha to 0 if black
                data[i+3] = 0;
            }

        }
        ctx.putImageData(imageData, 0, 0);

        font.texture = await this.m_framework.textureManager.createTexture(canvas,{
            textureFormat: "rgba8unorm",
        });
        canvas.remove();

        // cells size.
        let cell_size_x = 0;
        let cell_size_y = 0;

        // go through each line.
        const lines = (await data_or_file_path).split("\n");
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
                char_info.size = new Vec2(cell_size_x, cell_size_y);

                // if --- Base Width
                const comma_split = split_line[3].split(",");
                if (split_line[2] == "Base" && comma_split[0] == "Width")
                {
                    const width = Number(comma_split[1]);
                    char_info.size = new Vec2(cell_size_x, cell_size_y);
                    char_info.advance = width;
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

        // number of cells doesn't have to match with width, account for that when looking for new row
        const xRemainder = bitmap.width % cell_size_x;
        const correctedBitmapWidth = bitmap.width - xRemainder;

        const cell_size_x_norm = cell_size_x / canvas.width;
        const cell_size_y_norm = cell_size_y / canvas.height;

        // for each ASCII char
        for (let i = 0; i < 128; i++)
        {
            // now get ascii chars.
            const ascii = String.fromCharCode(i);
            const ch = font.createOrGetFontCharacterInfo(ascii);

            // find texture coordinates.
            const tx = x / canvas.width;
            const ty = y / canvas.height;

            ch.textureCoords = new Quad2D(
                new Vec2(tx, ty), // tl
                new Vec2(tx + cell_size_x_norm, ty), // tr
                new Vec2(tx + cell_size_x_norm, ty + cell_size_y_norm), // br
                new Vec2(tx, ty + cell_size_y_norm), // bl
            );

            // advance x and y
            x += cell_size_x;
            if (x >= correctedBitmapWidth)
            {
                x = 0;
                y += cell_size_y;
            }
        }


        return font;
    }
}