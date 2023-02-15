import { hasOnlyExpressionInitializer } from "typescript";
import { FrameworkUtils } from "./FrameworkUtil";
import { Vec2 } from "./math/vec/Vec2";


/**
 * The common type for all the texture data.
 */
type TextureData = HTMLCanvasElement | HTMLImageElement | ArrayBuffer | ImageBitmap;

/**
 * @brief The texture filtering options.
 */
enum TextureFiltering
{
    /**
     * @brief The neareast or point filtering. Selects the closest texel to texture coordinate.
     * Recommended if pixel perfect precision is needed.
     */
    Point,

    /**
     * @brief Takes an interpolated value from the texture coordinate's neighboring texels,
     * approximating a color between the texels.
     */
    Bilinear,
};

enum TextureWrap
{
    /**
     * @brief The texture will repeat if uv coordinates go above or below usual 0-1.
     */
    Repeat,

    /**
     * Same as TextureWrap.Repeat but mirrored
     */
    MirroredRepeat,

    /**
     * @brief The texture will be clamped to edge if texture coordinates go above or below usual 0-1.
     */
    ClampToEdge
}

/**
 * @brief Which channels to use.
 */
enum TextureFormat
{
    INVALID = 0,
    RED = 1,
    RG8 = 2,
    RGB = 3,
    RGBA = 4,
};

/**
 * @brief Options to pass when creating a texture.
 */
class TextureOptions
{
    public textureFormat? :TextureFormat;
    public textureFiltering?: TextureFiltering;
    public textureWrap?: TextureWrap;

    /**
     * Must be specified, if TextureData is of type ArrayBufferView.
     */
    public textureSize?: Vec2;
}

/**
 * The texture interface.
 */
abstract class Texture2D
{
    readonly id: string;
    readonly width: number;
    readonly height: number;

    constructor()
    {
        this.id = FrameworkUtils.generateId();
    }

    /**
     * The async intialize method.
     */
    async initialize() : Promise<void> {}
    

    /**
     * Sets the active texture unit.
     * Texture unit describes in webgl texture position in shader.
     * By default 0.
     * 
     * @param { number } index - index of texture unit. By default 0.
     */
    abstract active (index: number);

    /**
     * @brief Use the current texture.
     */
     abstract bind (): void;

    /**
     * @brief Release the current texture.
     */
     abstract destroy (): void;
};

/**
 * @brief The texture manager interface.
 */
 interface TextureManager
{

    /**
     * @brief Initialize the texture manager.
     * @returns { void }
     */
    initialize (): void;

    /**
     * @brief Loads the texture from path. Once loaded texture can be refrenced by key.
     *
     * @param { string } path - path to load texture.
     * @param { string } key - key to reference texture by and store it in cache with key. If null, texture is not stored, therefore should be disposed/destroyed by caller.
     * @param { TextureOptions | undefined } options - the texture options to pass.
     *  @return { Promise<Texture2D> }
     */
    loadTexture2D (path: string, key?: string, options?: TextureOptions): Promise<Texture2D>;

    /**
     * Create the texture.
     * @param { TextureData } data 
     * @param { number } width
     * @param { number } height
     * @param { TextureOptions | null } options 
     */
    createTexture (data: TextureData, width: number, height: number, options?: TextureOptions): Promise<Texture2D>;


    /**
     * Create the texture and store it in cache, so that it can be referenced later.
     * If stored in cache, calling 'destroy' or 'freeResources' will destroy texture as well. 
     * @param { TextureData } data 
     * @param { string } key - key to cache texture by.
     * @param { number } width
     * @param { number } height
     * @param { TextureOptions | null } options 
     */
    createCacheTexture (data: TextureData, key: string, width: number, height: number, options?: TextureOptions): Texture2D;

    /**
     * Create the randomness texture.
     * @param { string } key 
     * @param { number } width 
     * @param { number } height 
     * @param { TextureOptions | undefined } options 
     */
    createRandomnessTexture(key: string, width: number, height: number, options?: TextureOptions) : Texture2D;

    /**
     * @brief Get the Texture object from key or path.
     *
     * @param { string } key_or_path
     * @return { Texture2D }
     */
    getTexture (key_or_path: string): Texture2D

    /**
     * Gets the texture path from saved texture.
     * @param { Texture2D } texture - the texture
     * @returns { string | null } - texture path or null. 
     */
    getPath (texture: Texture2D): string | null;

    /**
     * Gets the texture key from saved texture.
     * @param { Texture2D } texture - the texture
     * @returns { string | null } - texture key or null. 
     */
    getKey (texture: Texture2D): string | null;

    /**
     * @brief Removes the texture from key or path.
     *
     * @param { string } key_or_path
     */
    removeTexture (key_or_path: string): void;

    /**
     * @brief Frees all the resources taken by texture manager.
     */
    freeResources (): void;

    /**
     * @brief Destroy the object.
     */
    destroy (): void;
};

export
{
    Texture2D,
    TextureFormat as TextureChannel,
    TextureOptions,
    TextureFiltering,
    TextureWrap
};

export type {
    TextureData,
    TextureManager
};
