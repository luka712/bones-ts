import { text } from "stream/consumers";
import { LifecycleState } from "../../framework/bones_common";
import { ImageLoader } from "../../framework/bones_loaders";
import { Vec2 } from "../../framework/bones_math";
import { TextureManager, Texture2D, TextureOptions, TextureChannel, TextureData } from "../../framework/bones_texture";
import { GLTexture2D } from "../../webgl/GLTexture";
import { WebGPURenderer } from "../WebGPURenderer";
import { WebGPUTexture2D } from "./WebGPUTexture";

/**
 * The WebGL implementation of TextureManager.
 */
 export class WebGPUTextureManager implements TextureManager 
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
 
     constructor(private m_renderer: WebGPURenderer, private m_imageLoader: ImageLoader)
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
 
         const texture = new WebGPUTexture2D(this.m_renderer.device, data, TextureChannel.RGBA, options);
         await texture.initialize();
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
         const tex = new WebGPUTexture2D(this.m_renderer.device, data, options?.channel ?? TextureChannel.RGBA);
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
         const texture = new WebGPUTexture2D(this.m_renderer.device, data, options?.channel ?? TextureChannel.RGBA, options);
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