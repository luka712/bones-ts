import { pipeline } from "stream";
import { EmitHint } from "typescript";
import { isArrayBufferView } from "util/types";
import { LifecycleState } from "../../framework/bones_common";
import { ImageLoader } from "../../framework/bones_loaders";
import { Vec2 } from "../../framework/bones_math";
import { Texture2D, TextureManager, TextureChannel, TextureData, TextureFiltering, TextureOptions, TextureWrap } from "../../framework/bones_texture";


/**
 * The gl texture.
 */
export class WebGPUTexture2D extends Texture2D
{
    private m_state: LifecycleState;


    /**
     * The sampler. Exposed so that it can be used by shader, when creating texture bind group.
     * @see {@link GPUSampler}
     */
    public sampler: GPUSampler

    /**
     * The texture. Exposed so that it can be used by shader, when creating texture bind group.
     * @see {@link GPUTexture}
     */
    public texture: GPUTexture;

    public readonly width: number;
    public readonly height: number;

    /**
     * Return the WebGLTexture as handle.
     */
    public get handle (): GPUTexture 
    {
        return this.texture;
    }

    /**
     * Construct a texture
     * @param { WebGL2RenderingContext } m_gl 
     * @param m_source {@link TextureData} null can be used, for creating empty texture, such as when needing to create framebuffer texture. 
     * @param { number } width 
     * @param { number } height 
     * @param { TextureChannel } channel // TODO: can be passed from texture optionsb
     * @param m_texture_options {@link TextureOptions} various texture options.
     */
    constructor(private m_device: GPUDevice, private m_source: TextureData | null, channel: TextureChannel, private m_texture_options?: TextureOptions)
    {
        super();
        if (m_source instanceof HTMLImageElement || m_source instanceof HTMLCanvasElement)
        {
            // if textureSize is specified, use it, otherwise use data from image.
            this.width = m_texture_options?.textureSize?.x ?? m_source.width;
            this.height = m_texture_options?.textureSize?.y ?? m_source.height;
        }
        else 
        {
            // can't resolve width and height without it
            if (!m_texture_options.textureSize)
            {
                throw new Error("GLTexture2D::constructor textureOptions::textureSize must be specified if source is of type 'ArrayBuffer'.");
            }

            this.width = m_texture_options.textureSize.x;
            this.height = m_texture_options.textureSize.y;
        }

        this.m_state = LifecycleState.Created;
    }

    /**
     * Initialize the texture.
     */
    public async initialize (): Promise<void>
    {

        // create empty texture
        this.texture = this.m_device.createTexture({
            size: [this.width, this.height],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        });

        // update image to gpu texture
        let src = this.m_source;
        if (src instanceof HTMLImageElement)
        {
            src = await createImageBitmap(src);
        }

        this.m_device.queue.copyExternalImageToTexture(
            { source: src as ImageBitmap },
            { texture: this.texture },
            [this.width, this.height]);

        // create a sampler
        const filter = this.m_texture_options?.textureFiltering == TextureFiltering.Bilinear ? 'linear' : 'nearest'
        this.sampler = this.m_device.createSampler({
            magFilter: filter,
            minFilter: filter,
        });


    }

    /**
     * Sets the active texture unit.
     * By default 0.
     * 
     * @param { number } index - index of texture unit 
     */
    public active (index: number = 0)
    {
        // never call it, if called, then it's error.
        throw new Error("WebGPUTexture2D::active. NOT USED!");
    }


    /**
     * The gl texture.
     */
    public bind (): void
    {
        // never call it, if called, then it's error.
        throw new Error("WebGPUTexture2D::bind. NOT USED!");
    }

    /**
     * Destroy the texture.
     */
    public destroy (): void
    {
        if (this.m_state != LifecycleState.Destroyed)
        {
            this.texture.destroy();
        }
        this.m_state = LifecycleState.Destroyed;
    }
}
