import { Framework } from "../Framework";
import { LifecycleState } from "../bones_common";
import { Vec2 } from "../bones_math";
import { Texture2D, TextureData, TextureOptions } from "./Texture2D";

/**
 * The WebGL implementation of TextureManager.
 */
export class TextureManager {
    private m_state: LifecycleState;

    /**
     * Texture key, and texture.
     */
    private m_textureCache: { [id: string]: Texture2D };

    /**
     * Key is texture key, value is path to a texture.
     */
    private m_texturePath: { [id: string]: string };

    constructor(private readonly m_framework: Framework) {
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
    public createRandomnessTexture (key: string, width: number, height: number, options?: TextureOptions): Texture2D {
        const size = width * height * 4;
        const data = new Uint8Array(size);

        for (let i = 0; i < size; i += 4) {
            data[i] = Math.random() * 255;
            data[i + 1] = Math.random() * 255;
            data[i + 2] = Math.random() * 255;
            data[i + 3] = Math.random() * 255;
        }

        options = options ?? {};

        if (!options.textureSize) {
            options.textureSize = new Vec2(width, height);
        }
        return this.createCacheTexture(data, key, options);
    }


    /**
     * The initialize method.
     */
    public initialize (): void {
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
    public async loadTexture2D (path: string, key?: string, options?: TextureOptions): Promise<Texture2D> {
        const data = await this.m_framework.imageLoader.loadImage(path);

        const texture = new Texture2D(this.m_framework, data, options);
        await texture.initialize();
        if (key) {
            // if there is already same texture in cache, destroy it before creating a new one.
            if (this.m_textureCache[key]) {
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
    * @param { TextureOptions | null } options 
    */
    public async createTexture (data: TextureData, options?: TextureOptions): Promise<Texture2D> {
        const tex = new Texture2D(this.m_framework, data, options);
        await tex.initialize();
        return tex;
    }

    /**
     * Create the texture and store it in cache, so that it can be referenced later.
     * If stored in cache, calling 'destroy' or 'freeResources' will destroy texture as well. 
     * @param { TextureData } data 
     * @param { string } key - key to cache texture by.
     * @param { TextureOptions | null } options 
     */
    public async createCacheTexture (data: TextureData, key: string, options?: TextureOptions): Promise<Texture2D> {
        if (this.m_textureCache[key]) {
            this.m_textureCache[key].destroy();
        }
        const texture = new Texture2D(this.m_framework, data, options);
        await texture.initialize();
        this.m_textureCache[key] = texture;
        return texture;
    }

    /**
     * Creates the empty texture.
     * @param width The width of the texture. Takes precedence over @see {@link TextureOptions.textureSize}
     * @param height The height of the texture. Takes precedence over @see {@link TextureOptions.textureSize}
     * @param key The key to store the texture by.
     * @param options The texture options.
     * @returns @see {@link Promise<Texture2D> }
     */
    public async createEmpty (width: number, height: number, key?: string, options?: TextureOptions): Promise<Texture2D> {

        if (!options) {
            options = {};
        }
        if (!options.textureSize) {
            options.textureSize = new Vec2(width, height);
        }

        if (key) {
            return await this.createCacheTexture(null, key, options);
        }
        else {
            return await this.createTexture(null, options);
        }
    }

    /**
       * @brief Get the Texture object from key or path.
       *
       * @param { string } key_or_path
       * @return { Texture2D }
       */
    public getTexture (key_or_path: string): Texture2D {
        return this.m_textureCache[key_or_path];
    }


    /**
     * Gets the texture path from saved texture.
     * @param { Texture2D } texture - the texture
     * @returns { string | null } - texture path or null. 
     */
    public getPath (texture: Texture2D): string | null {
        for (var key in this.m_textureCache) {
            if (this.m_textureCache[key] == texture) {
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
    public getKey (texture: Texture2D): string | null {
        for (var key in this.m_textureCache) {
            if (this.m_textureCache[key] == texture) {
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
    public removeTexture (key_or_path: string): void {
        this.m_textureCache[key_or_path].destroy();
        delete this.m_textureCache[key_or_path];
    }

    /**
     * @brief Frees all the resources taken by texture manager.
     */
    public freeResources (): void {
        for (let key in this.m_textureCache) {
            this.m_textureCache[key].destroy();
        }
        this.m_textureCache = {};
        this.m_texturePath = {};
    }

    /**
     * @brief Destroy the object.
     */
    public destroy (): void {
        this.freeResources();
        this.m_state = LifecycleState.Destroyed;
    }

}