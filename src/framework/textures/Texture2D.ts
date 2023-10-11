
import { Framework } from "../Framework";
import { LifecycleState } from "../bones_common";
import { Vec2 } from "../bones_math";



/**
 * The common type for all the texture data.
 */
export type TextureData = HTMLCanvasElement | HTMLImageElement | ArrayBuffer | ImageBitmap | null;


/**
 * @brief Options to pass when creating a texture.
 */
export class TextureOptions {

    /**
     * The label of the texture.
     */
    public label?: string;

    /**
     * The texture usage flags.
     */
    public textureUsage?: GPUTextureUsageFlags;

    /**
     * The format of the texture.
     */
    public textureFormat?: GPUTextureFormat;

    /**
     * The mag filter.
     */
    public magFilter?: GPUFilterMode;

    /**
     * The min filter.
     */
    public minFilter?: GPUFilterMode;

    /**
     * Must be specified, if TextureData is of type ArrayBufferView.
     */
    public textureSize?: Vec2;
}

/**
 * The gl texture.
 */
export class Texture2D {
    private static m_id = 0;

    private m_state: LifecycleState;

    /**
     * The id of the texture.
     */
    public readonly id: number;

    public readonly width: number;
    public readonly height: number;

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

    /**
     * Return the WebGLTexture as handle.
     */
    public get handle (): GPUTexture {
        return this.texture;
    }

    /**
     * Construct a texture
     * @param m_framework {@link Framework}
     * @param m_source {@link TextureData} null can be used, for creating empty texture, such as when needing to create framebuffer texture. 
     * @param m_textureOptions {@link TextureOptions} various texture options.
     */
    constructor(private m_framework: Framework, private m_source: TextureData | null, private m_textureOptions: TextureOptions | null = null) {
        this.id = Texture2D.m_id++;
        if (m_source instanceof HTMLImageElement || m_source instanceof HTMLCanvasElement) {
            // if textureSize is specified, use it, otherwise use data from image.
            this.width = m_textureOptions?.textureSize?.x ?? m_source.width;
            this.height = m_textureOptions?.textureSize?.y ?? m_source.height;
        }
        else {
            // can't resolve width and height without it
            if (!m_textureOptions.textureSize) {
                throw new Error("GLTexture2D::constructor textureOptions::textureSize must be specified if source is of type 'ArrayBuffer'.");
            }

            this.width = m_textureOptions.textureSize.x;
            this.height = m_textureOptions.textureSize.y;
        }

        this.m_state = LifecycleState.Created;
    }


    /**
     * Initialize the texture.
     */
    public async initialize (): Promise<void> {
        const device = this.m_framework.context.device;

        // create empty texture
        const format = this.m_textureOptions?.textureFormat ?? "rgba8unorm";
        const usage = this.m_textureOptions?.textureUsage ?? (GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT);

        this.texture = device.createTexture({
            label: this.m_textureOptions?.label ?? "Texture2D",
            size: { width: this.width, height: this.height },
            format,
            usage
        });

        // update image to gpu texture if there is src
        let src = this.m_source;
        if (src) {
            if (src instanceof HTMLImageElement) {
                src = await createImageBitmap(src);
            }
            device.queue.copyExternalImageToTexture(
                { source: src as ImageBitmap },
                { texture: this.texture },
                [this.width, this.height]);
        }

        // create a sampler
        const magFilter = this.m_textureOptions?.magFilter ?? "linear";
        const minFilter = this.m_textureOptions?.minFilter ?? "linear";

        this.sampler = device.createSampler({
            magFilter,
            minFilter
        });
    }

    /**
     * Destroy the texture.
     */
    public destroy (): void {
        if (this.m_state != LifecycleState.Destroyed) {
            this.texture.destroy();
        }
        this.m_state = LifecycleState.Destroyed;
    }
}
