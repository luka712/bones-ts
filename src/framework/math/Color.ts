import { BaseMatrix } from "./BaseMatrix";


/**
 * The color class of floats with componenents RGBA
 */
export class Color extends BaseMatrix<Color>
{
    constructor(r: number, g: number, b: number, a: number)
    {
        super(4);
        this[0] = r;
        this[1] = g;
        this[2] = b;
        this[3] = a;
    }

    public get r (): number { return this[0]; }
    public set r (v: number) { this[0] = v; }

    public get g (): number { return this[1]; }
    public set g (v: number) { this[1] = v; }

    public get b (): number { return this[2]; }
    public set b (v: number) { this[2] = v; }

    public get a (): number { return this[3]; }
    public set a (v: number) { this[3] = v; }

    /**
     * ove byte to hex.
     * @param { number } byte 
     * @returns { string }
     */
    private byteToHex (byte: number): string
    {
        let hex = byte.toString(16)
        if (hex.length < 2)
        {
            return "0" + hex;
        }
        return hex;
    }

    /**
     * Convert color to ABGR8888 string representation.
     */
    public ToABGR8888 (): string 
    {
        // prevent overflow
        const R = Math.min(this[0], 1.0);
        const G = Math.min(this[1], 1.0);
        const B = Math.min(this[2], 1.0);
        const A = Math.min(this[3], 1.0);

        const r = Math.floor(R * 255);
        const g = Math.floor(G * 255);
        const b = Math.floor(B * 255);
        const a = Math.floor(A * 255);

        return "0x" + this.byteToHex(a) + this.byteToHex(b) + this.byteToHex(g) + this.byteToHex(r);
    }

    /**
     * Returns a new copy of a color.
     */
    public copy (): Color
    {
        return new Color(this[0], this[1], this[2], this[3]);
    }

    /**
     * Color defined by r:0,g:0,b:0,a:0.
     */
    public static transparent(): Color 
    {
        return new Color(0,0,0,0);
    }

    /**
     * The black color.
     * @returns { Color } - new instance
     */
    public static black (): Color 
    {
        return new Color(0, 0, 0, 1);
    }

    /**
     * The full white color.
     * @returns { Color } - new instance
     */
    public static white (): Color 
    {
        return new Color(1, 1, 1, 1);
    }

    /**
     * The red color instance.
     * @returns { Color } - new instance
     */
    public static red (): Color 
    {
        return new Color(1, 0, 0, 1);
    }

    /**
    * The green color instance.
    * @returns { Color } - new instance
    */
    public static green (): Color 
    {
        return new Color(0, 1, 0, 1);
    }

    /**
     * The blue color instance.
     * @returns { Color } - new instance
     */
    public static blue (): Color 
    {
        return new Color(0, 0, 1, 1);
    }

    /**
     * The gray color instance.
     * @returns { Color | Float32Array} - new instance.
     */
    public static gray (): Color | Float32Array
    {
        return new Color(0.5, 0.5, 0.5, 1.0);
    }

    /**
     * Create the dark slate gray color instance.
     * @returns { Color | Float32Array } - new instance
     */
    public static darkSlateGray (): Color | Float32Array
    {
        return new Color(0.1843, 0.3098, 0.3098, 1.0);
    }

    /**
     * Returns the Celeste color 
     * @returns { Color | Float32Array}
     */
    public static celeste (): Color | Float32Array
    {
        return new Color(0.698, 1, 1, 1);
    }

    /**
     * The color instance with alpha being set to 1.
     * @returns { Color | Float32Array } - new instance
     */
    public static alpha (): Color | Float32Array
    {
        return new Color(0, 0, 0, 1);
    }

    /**
    * Returns the light pink color.
    *
    * @return { Color } 
    */
    public static lightPink (): Color
    {
        return new Color(1.0, 0.71, 0.76, 1.0);
    }

    /**
     * Returns the light gray color.
     * 
     * @return { Color }
     */
    public static lightGray (): Color
    {
        return new Color(0.83, 0.83, 0.83, 1.0);
    }

    /**
     * Returns the yellow color.
     * 
     * @return { Color } 
     */
    public static yellow (): Color
    {
        return new Color(1.0, 1.0, 0.0, 1.0);
    }


    /**
     * @brief Returns the grayish blue color.
     * 
     * @return Color 
     */
    public static grayishBlue (): Color
    {
        return new Color(163.0 / 255.0, 167.0 / 255.0, 194.0 / 255.0, 1.0);
    }

    /**
     * Adds two colors and returns a new color.
    */
    public static add (a: Color | Float32Array, b: Color | Float32Array, out?: Color | Float32Array): Color | Float32Array
    {
        if (!out)
        {
            out = new Color(0, 0, 0, 0);
        };

        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        out[2] = a[2] + b[2];
        out[3] = a[3] + b[3];
        return out;
    }

    /**
     * Subtract.
     * @param { Color | Float32Array } a 
     * @param { Color | Float32Array } b 
     * @param { Color | Float32Array | undefined } out 
     * @returns { Color | Float32Array }
     */
    public static subtract (a: Color | Float32Array, b: Color | Float32Array, out?: Color | Float32Array): Color | Float32Array
    {
        if (!out)
        {
            out = new Color(0, 0, 0, 0);
        };

        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
        out[2] = a[2] - b[2];
        out[3] = a[3] - b[3];
        return out;
    }

    /**
    * Multiplies two colors element-wise and returns a new color.
    * Aka: Hadamard product or element-wise product
    */
    public static multiply (a: Color | Float32Array, b: Color | Float32Array, out?: Color | Float32Array): Color | Float32Array
    {
        if (!out)
        {
            out = Color.black();
        }

        out[0] = a[0] * b[0];
        out[1] = a[1] * b[1];
        out[2] = a[2] * b[2];
        out[3] = a[3] * b[3];
        return out;
    }

    /**
     * Multiple color with a scalar 
     * @param { Color | Float32Array } color 
     * @param { number } scalar 
     * @param { Color | Float32Array |undefined } - if passed in, result is saved to last parameter and returned 
     * @param { Color | Float32Array }
     */
    public static multiplyWithScalar (color: Color | Float32Array, scalar: number, out?: Color | Float32Array): Color | Float32Array
    {
        if (!out)
        {
            out = Color.black();
        }

        out[0] = color[0] * scalar;
        out[1] = color[1] * scalar;
        out[2] = color[2] * scalar;
        out[3] = color[3] * scalar;
        return out;
    }

    /**
     * Create the color for light from array.
     */
    public static fromArray (arr: ArrayLike<number>): Color 
    {
        if (arr.length > 3)
        {
            return new Color(arr[0], arr[1], arr[2], arr[3]);
        }
        else
        {
            return new Color(arr[0], arr[1], arr[2], 1);
        }
    }

    /**
     * Returns color as common JavaScript array in range 0 - 255.
     * @param { Color | Float32Array } color 
     * @param { Array<number> | undefined} out - if passed in this instance is filled out, otherwise new instance is created and returned.
     * @returns { Array<number> }
     */
    public static toRGBA255Array (color: Color | Float32Array, out?: Array<number>): Array<number>
    {
        if (!out)
        {
            out = [0, 0, 0, 0];
        }

        out[0] = color[0] * 255;
        out[1] = color[1] * 255;
        out[2] = color[2] * 255;
        out[3] = color[3] * 255;

        return out;
    }

    /**
     * From color in range 0 - 255 create a new color or passes result to passed in 'out' instance.
     * @param { Array<number> } array 
     * @param { Color | Float32Array | undefined } out 
     * @returns { Color | Float32Array }
     */
    public static fromRGBA255Array (array: Array<number>, out?: Color | Float32Array): Color | Float32Array
    {
        if (!out)
        {
            out = new Color(0, 0, 0, 0);
        }


        out[0] = array[0] / 255;
        out[1] = array[1] / 255;
        out[2] = array[2] / 255;
        out[3] = array[3] / 255;

        return out;
    }
}

export class ColorUtil
{

    /**
     * Move colors to array buffer in RGBA format.
     * @param { Array<Array<Color>>} colors - colors to move to buffer
     * @param { ArrayBuffer } fill_buffer - buffer to fill.
     * @param number offset_bytes - offset if any.
     */
    public static colorsToRGBA8888Pixels (colors: Array<Array<Color | Float32Array>>, fill_buffer: ArrayBuffer, offset_bytes: number = 0): void 
    {
        const signed_array = new Uint8ClampedArray(fill_buffer);

        // Where to start in buffer 
        let pixel_index = offset_bytes;

        let y = -1;
        let y_len = colors.length - 1;
        while (y < y_len)
        {
            y++
            let x = -1;
            let x_len = colors[y].length - 1;
            while (x < x_len)
            {
                x++;
                const color = colors[y][x];

                signed_array[pixel_index++] = color[0] * 255;
                signed_array[pixel_index++] = color[1] * 255;
                signed_array[pixel_index++] = color[2] * 255;
                signed_array[pixel_index++] = color[3] * 255;
            }
        }
    }


    /**
     * Move colors to array buffer in ABGR format
     * @param { Array<Array<Color>>} colors - colors to move to buffer
     * @param { ArrayBuffer } fill_buffer - buffer to fill.
     * @param number offset_bytes - offset if any.
     */
    public static colorsToABGR8888Pixels (colors: Array<Array<Color>>, fill_buffer: ArrayBuffer, offset_bytes: number = 0): void 
    {
        const signed_array = new Uint8Array(fill_buffer);

        // Where to start in buffer 
        let pixel_index = offset_bytes;
        for (let y = 0; y < colors.length; y++)
        {
            for (let x = 0; x < colors[y].length; x++)
            {
                const color = colors[y][x];

                const r = Math.min(color[0], 1.0) * 255;
                const g = Math.min(color[1], 1.0) * 255;
                const b = Math.min(color[2], 1.0) * 255;
                const a = Math.min(color[3], 1.0) * 255;

                signed_array[pixel_index++] = a;
                signed_array[pixel_index++] = b;
                signed_array[pixel_index++] = g;
                signed_array[pixel_index++] = r;
            }
        }
    }
}