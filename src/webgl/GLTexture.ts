import { EmitHint } from "typescript";
import { isArrayBufferView } from "util/types";
import { LifecycleState } from "../framework/bones_common";
import { ImageLoader } from "../framework/bones_loaders";
import { Vec2 } from "../framework/bones_math";
import { Texture2D, TextureManager, TextureChannel, TextureData, TextureFiltering, TextureOptions, TextureWrap } from "../framework/bones_texture";


/**
 * The gl texture.
 */
export class GLTexture2D extends Texture2D
{
    private m_glTexture: WebGLTexture;
    private m_state: LifecycleState;


    public readonly width: number;
    public readonly height: number;

    /**
     * Return the WebGLTexture as handle.
     */
    public get handle (): WebGLTexture 
    {
        return this.m_glTexture;
    }

    /**
     * Construct a texture
     * @param { WebGL2RenderingContext } m_gl 
     * @param { TextureData | null } source - null can be used, for creating empty texture, such as when needing to create framebuffer texture. 
     * @param { number } width 
     * @param { number } height 
     * @param { TextureChannel } channel // TODO: can be passed from texture optionsb
     * @param { TextureFiltering } texture_filtering 
     */
    constructor(private m_gl: WebGL2RenderingContext, source: TextureData | null, channel: TextureChannel, texture_options?: TextureOptions)
    {
        super();
        if (source instanceof HTMLImageElement || source instanceof HTMLCanvasElement)
        {
            // if textureSize is specified, use it, otherwise use data from image.
            this.width = texture_options?.textureSize?.x ?? source.width;
            this.height = texture_options?.textureSize?.y ?? source.height;
        }
        else 
        {
            // can't resolve width and height without it
            if (!texture_options.textureSize)
            {
                throw new Error("GLTexture2D::constructor textureOptions::textureSize must be specified if source is of type 'ArrayBuffer'.");
            }

            this.width = texture_options.textureSize.x;
            this.height = texture_options.textureSize.y;
        }

        const gl = this.m_gl;

        this.m_gl.pixelStorei(this.m_gl.UNPACK_ALIGNMENT, 1); // disable byte-alignment restriction

        this.m_glTexture = this.m_gl.createTexture();
        this.m_gl.bindTexture(this.m_gl.TEXTURE_2D, this.m_glTexture);

        // TODO: handle this cases with some map!!!
        if (channel == TextureChannel.RGBA)
        {
            this.m_gl.texImage2D(this.m_gl.TEXTURE_2D, 0, this.m_gl.RGBA, this.width, this.height, 0, this.m_gl.RGBA, this.m_gl.UNSIGNED_BYTE, source as unknown as ArrayBufferView);
        }
        else if (channel == TextureChannel.RGB)
        {
            this.m_gl.texImage2D(this.m_gl.TEXTURE_2D, 0, this.m_gl.RGB, this.width, this.height, 0, this.m_gl.RGB, this.m_gl.UNSIGNED_BYTE, source as unknown as ArrayBufferView);
        }
        else if (channel == TextureChannel.RED)
        {
            //  glPixelStorei(GL_UNPACK_ALIGNMENT, 1); // disable byte-alignment restriction
            this.m_gl.texImage2D(this.m_gl.TEXTURE_2D, 0, this.m_gl.RED, this.width, this.height, 0, this.m_gl.RED, this.m_gl.UNSIGNED_BYTE, source as unknown as ArrayBufferView);
        }
        else if (channel == TextureChannel.RG8)
        {
            this.m_gl.texImage2D(this.m_gl.TEXTURE_2D, 0, this.m_gl.RG8, this.width, this.height, 0, this.m_gl.RG, this.m_gl.UNSIGNED_BYTE, source as unknown as ArrayBufferView);
        }
        this.m_gl.generateMipmap(this.m_gl.TEXTURE_2D);

        // set the texture wrapping parameters
        let wrap: GLenum = this.m_gl.CLAMP_TO_EDGE;
        if (texture_options?.textureWrap == TextureWrap.Repeat)
        {
            wrap = this.m_gl.REPEAT;
        }
        else if (texture_options?.textureWrap == TextureWrap.MirroredRepeat)
        {
            wrap = this.m_gl.MIRRORED_REPEAT;
        }

        this.m_gl.texParameteri(this.m_gl.TEXTURE_2D, this.m_gl.TEXTURE_WRAP_S, wrap);
        this.m_gl.texParameteri(this.m_gl.TEXTURE_2D, this.m_gl.TEXTURE_WRAP_T, wrap);

        // set the texture filtering parameters
        let filtering : GLenum = this.m_gl.NEAREST;
        if (texture_options?.textureFiltering == TextureFiltering.Bilinear)
        {
            filtering = this.m_gl.LINEAR;
        }

        this.m_gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtering);
        this.m_gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtering);

        this.m_state = LifecycleState.Created;
    }


    /**
     * Sets the active texture unit.
     * By default 0.
     * 
     * @param { number } index - index of texture unit 
     */
    public active (index: number = 0)
    {
        this.m_gl.activeTexture(this.m_gl.TEXTURE0 + index);
    }


    /**
     * The gl texture.
     */
    public bind (): void
    {
        this.m_gl.bindTexture(this.m_gl.TEXTURE_2D, this.m_glTexture);
    }

    /**
     * Destroy the texture.
     */
    public destroy (): void
    {
        if (this.m_state != LifecycleState.Destroyed)
        {
            this.m_gl.deleteTexture(this.m_glTexture);
        }
        this.m_state = LifecycleState.Destroyed;
    }

    /**
     * Creates a new empty texture.
     * @param gl - the gl context.
     * @param size - the size of a texture. {@link TextureOptions.textureSize} is ignored as size is passed as second parameter.
     * @param options - the options. {@link TextureOptions.textureSize} is ignored as size is passed as second parameter.
     */
    public static createEmpty (gl: WebGL2RenderingContext, size: Vec2, options?: TextureOptions): Texture2D 
    {
        const channel = options?.channel ?? TextureChannel.RGBA;

        if (!options)
        {
            options = {};
        }
        options.textureSize = size;


        return new GLTexture2D(gl, null, channel, options);
    }
}

/**
 * The WebGL implementation of TextureManager.
 */
class GLTextureManager implements TextureManager 
{
    private m_state: LifecycleState;

    /**
     * Texture key, and texture.
     */
    private m_textureCache: { [id: string]: Texture2D };

    /**
     * Key is texture key, value is path to a texture.
     */
    private m_texturePath: { [id: string]: string };

    constructor(private m_gl: WebGL2RenderingContext, private m_imageLoader: ImageLoader)
    {
        this.m_textureCache = {};
        this.m_texturePath = {};
    }

    /**
     * Create the randomness texture.
     * @param { string } key 
     * @param { number } width 
     * @param { number } height 
     * @param { TextureOptions | undefined } options 
     */
    public createRandomnessTexture (key: string, width: number, height: number, options?: TextureOptions): Texture2D
    {
        const size = width * height;
        const data = new Uint8Array(width * height * 4);

        for (let i = 0; i < size; i += 4)
        {
            data[i] = Math.random() * 255;
            data[i + 1] = Math.random() * 255;
            data[i + 2] = Math.random() * 255;
            data[i + 3] = Math.random() * 255;
        }

        options = options ?? {};

        if (!options.textureSize)
        {
            options.textureSize = new Vec2(width, height);
        }
        return this.createCacheTexture(data, key, width, height, options);
    }


    /**
     * The initialize method.
     */
    public initialize (): void
    {
        this.m_state = LifecycleState.Initialized;
    }

    /**
     * @brief Loads the texture from path. Once loaded texture can be refrenced by key.
     *
     * @param { string } path - path to load texture.
     * @param { string } key - key to reference texture by and store it in cache with key. If null, texture is not stored, therefore should be disposed/destroyed by caller.
     * @param { TextureOptions | undefined } options - the texture options to pass.
     *  @return { Promise<Texture2D> }
     */
    public async loadTexture2D (path: string, key?: string, options?: TextureOptions): Promise<Texture2D>
    {
        const data = await this.m_imageLoader.loadImage(path);

        const texture = new GLTexture2D(this.m_gl, data, TextureChannel.RGBA, options);
        if (key)
        {
            // if there is already same texture in cache, destroy it before creating a new one.
            if (this.m_textureCache[key])
            {
                this.m_textureCache[key].destroy();
            }
            this.m_textureCache[key] = texture;
            this.m_texturePath[key] = path;
        }

        return texture;
    }

    /**
    * Create the texture.
    * @param { TextureData } data 
    * @param { number } width
    * @param { number } height
    * @param { TextureOptions | null } options 
    */
    public async createTexture (data: TextureData, width: number, height: number, options?: TextureOptions): Promise<Texture2D>
    {
        if (!options)
        {
            options = {};
        }

        if (!options.textureSize)
        {
            options.textureSize = new Vec2(width, height);
        }

        const tex = new GLTexture2D(this.m_gl, data, options?.channel ?? TextureChannel.RGBA, options);
        await tex.initialize();
        return tex;
    }

    /**
     * Create the texture and store it in cache, so that it can be referenced later.
     * If stored in cache, calling 'destroy' or 'freeResources' will destroy texture as well. 
     * @param { TextureData } data 
     * @param { string } key - key to cache texture by.
     * @param { number } width
     * @param { number } height
     * @param { TextureOptions | null } options 
     */
    public createCacheTexture (data: TextureData, key: string, width: number, height: number, options?: TextureOptions): Texture2D
    {
        if (this.m_textureCache[key])
        {
            this.m_textureCache[key].destroy();
        }
        const texture = new GLTexture2D(this.m_gl, data, options?.channel ?? TextureChannel.RGBA, options);
        this.m_textureCache[key] = texture;
        return texture;

    }

    /**
       * @brief Get the Texture object from key or path.
       *
       * @param { string } key_or_path
       * @return { Texture2D }
       */
    public getTexture (key_or_path: string): Texture2D
    {
        return this.m_textureCache[key_or_path];
    }


    /**
     * Gets the texture path from saved texture.
     * @param { Texture2D } texture - the texture
     * @returns { string | null } - texture path or null. 
     */
    public getPath (texture: Texture2D): string | null
    {
        for (var key in this.m_textureCache)
        {
            if (this.m_textureCache[key] == texture)
            {
                return this.m_texturePath[key];
            }
        }

        return null;
    }

    /**
    * Gets the texture key from saved texture.
    * @param { Texture2D } texture - the texture
    * @returns { string | null } - texture key or null. 
    */
    public getKey (texture: Texture2D): string | null
    {
        for (var key in this.m_textureCache)
        {
            if (this.m_textureCache[key] == texture)
            {
                return key;
            }
        }

        return null;
    }


    /**
     * @brief Removes the texture from key or path.
     *
     * @param { string } key_or_path
     */
    public removeTexture (key_or_path: string): void
    {
        this.m_textureCache[key_or_path].destroy();
        delete this.m_textureCache[key_or_path];
    }

    /**
     * @brief Frees all the resources taken by texture manager.
     */
    public freeResources (): void
    {
        for (let key in this.m_textureCache)
        {
            this.m_textureCache[key].destroy();
        }
        this.m_textureCache = {};
        this.m_texturePath = {};
    }

    /**
     * @brief Destroy the object.
     */
    public destroy (): void
    {
        this.freeResources();
        this.m_state = LifecycleState.Destroyed;
    }

}

export 
{
    GLTextureManager,
}