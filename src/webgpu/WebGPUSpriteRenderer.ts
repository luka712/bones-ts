import { LifecycleState } from "../framework/bones_common";
import { FileLoader } from "../framework/bones_loaders";
import { Rect, Color, Mat4x4 } from "../framework/bones_math";
import { Texture2D } from "../framework/bones_texture";
import { Vec3 } from "../framework/math/vec/Vec3";
import { BlendMode, SpriteRenderer } from "../framework/SpriteRenderer";
import { WebGPURendererContext } from "./WebGPURenderer";
import { WebGPUTexture2D } from "./textures/WebGPUTexture";
import { WebGPUSpritePipeline } from "./pipelines/WebGPUSpritePipeline";
import { IRenderer } from "../framework/bones_renderer";
import { WebGPUSpriteGeometryBuffer } from "./geometry/WebGPUSpriteGeometryBuffers";

/**
 * The WebGPU sprite renderer.
 */
export class WebGPUSpriteRenderer extends SpriteRenderer
{
    /**
     * The webgpu sprite pipeline.
     */
    private m_spritePipeline: WebGPUSpritePipeline;

    /**
     * The constant geometry buffer.
     */
    private m_constantGeometryBuffer: WebGPUSpriteGeometryBuffer;

    // For optimization, so that new matrices are not created each frame.
    private o_scale: Mat4x4;
    private o_transform: Mat4x4;
    private o_rotation: Mat4x4;

    // the texture coordinates.
    private o_texCoords: Float32Array;

    // tint color for optimization.
    private o_defaultTintColor: Color = Color.white();

    constructor(ctx: WebGPURendererContext, private readonly m_renderer: IRenderer,  private readonly m_fileLoader: FileLoader)
    {
        super();

        this.o_scale = Mat4x4.identity();
        this.o_transform = Mat4x4.identity();
        this.o_rotation = Mat4x4.identity();

        // initial or default state
        this.o_texCoords = new Float32Array([
            0, 0,
            0, 1,
            1, 1,
            1, 0
        ]);

        this.m_spritePipeline = new WebGPUSpritePipeline(ctx, m_fileLoader);
        this.m_constantGeometryBuffer = new WebGPUSpriteGeometryBuffer(ctx);
    }

    /**
       * @brief Set the Blending Mode for sprite batch.
       *
       * @param { BlendMode } mode
       * @returns { void }
       */
    protected setBlendingMode (mode: BlendMode): void
    {

    }


    /**
     * @brief Initialize the sprite batch manager. Initialize must be called in order to properly initialize all the variables.
     */
    public async initialize (): Promise<void>
    {
        this.m_state = LifecycleState.Initialized;

        await this.m_spritePipeline.initialize();
        this.m_constantGeometryBuffer.initialize();

        this.resize(this.m_renderer.bufferWidth, this.m_renderer.bufferHeight);
    }

    /**
     * @brief Destroy the sprite batch manager.
     */
    public destroy (): void
    {

    }

    /**
     * Begins render pass.
     * @param { GPURenderPassEncoder } data 
     */
    public beginRenderPass (data): void
    {
        this.m_spritePipeline.beginRenderPass();
    }

    /**
     * @brief Begins the sprite batch.
     */
    public begin (mode?: BlendMode): void
    {
        // set the pipeline and uniforms that need to changed only once per frame.
        this.m_spritePipeline.use(this.m_projectionMatrix, this.m_viewMatrix);
    }

    /**
     * @brief Draws the texture at position.
     *
     * @param { Texture2D } texture - which texture to draw.
     * @param { Rect } draw_rect - the drawing rectangle
     * @param { Vec2|undefined } tint_color - the color to be used as tint color. 
     * @param { Vec3|undefined } axis_of_rotation - if sprites needs to be rotated around arbitrary axis.
     * @param { number|undefined} rotation_in_radians - how much to rotate, in radians.
     */
    public draw (texture: Texture2D, draw_rect: Rect, tint_color?: Color, axis_of_rotation?: Vec3, rotation_in_radians?: number): void
    {
        const offset_x = draw_rect.w * 0.5;
        const offset_y = draw_rect.h * 0.5;

        // First get required matrices.
        Mat4x4.scaleMatrix(draw_rect.w, draw_rect.h, 1.0, this.o_scale);
        if (axis_of_rotation && rotation_in_radians >= 0)
        {
            Mat4x4.rotationMatrix(rotation_in_radians, axis_of_rotation, this.o_rotation);
        }
        else
        {
            Mat4x4.identity(this.o_rotation);
        }

        // transform will already contain translation here, saves 1 operation.
        Mat4x4.translationMatrix(draw_rect.x + offset_x, draw_rect.y + offset_y, 0, this.o_transform);

        // now multiply transform with translation with other matrices.
        Mat4x4.multiply(this.o_transform, this.o_rotation, this.o_transform);
        Mat4x4.multiply(this.o_transform, this.o_scale, this.o_transform);

        this.m_spritePipeline.setInstanceData(this.o_transform,tint_color ?? this.o_defaultTintColor, texture as WebGPUTexture2D );

        // bind and draw.
        this.m_constantGeometryBuffer.bind();
        this.m_constantGeometryBuffer.draw();
    }

    public drawSource (texture: Texture2D, draw_rect: Rect, source_rect: Rect, tint_color?: Color, axis_of_rotation?: Vec3, rotation_in_radians?: number): void
    {
        // // Find buffer to use. 
        // // Since it's mutable buffer, we use approach of having separate buffer for each instance.
        // if (this.m_mutableGeometryBufferInstanceIndex >= this.m_mutableGeometryBuffers.length)
        // {
        //     this.m_mutableGeometryBuffers.push(this.createGeometryBuffer(true));
        // }
        // const mutable_buffer = this.m_mutableGeometryBuffers[this.m_mutableGeometryBufferInstanceIndex];
        // this.m_mutableGeometryBufferInstanceIndex++;


        // // bind the current instance
        // this.m_shader.bindInstance(this.m_currentInstanceIndex);

        // const offset_x = draw_rect.w * 0.5;
        // const offset_y = draw_rect.h * 0.5;

        // // First get required matrices.
        // Mat4x4.scaleMatrix(draw_rect.w, draw_rect.h, 1.0, this.o_scale);
        // if (axis_of_rotation && rotation_in_radians >= 0)
        // {
        //     Mat4x4.rotationMatrix(rotation_in_radians, axis_of_rotation, this.o_rotation);
        // }
        // else
        // {
        //     Mat4x4.identity(this.o_rotation);
        // }

        // // transform will already contain translation here, saves 1 operation.
        // Mat4x4.translationMatrix(draw_rect.x + offset_x, draw_rect.y + offset_y, 0, this.o_transform);

        // // now multiply transform with translation with other matrices.
        // Mat4x4.multiply(this.o_transform, this.o_rotation, this.o_transform);
        // Mat4x4.multiply(this.o_transform, this.o_scale, this.o_transform);

        // this.m_shader.useTransform(this.o_transform);
        // this.m_shader.useTintColor(tint_color ?? this.o_defaultTintColor);
        // (this.m_shader as GPUSpriteShader).useSpriteTexture(texture as WebGPUTexture2D);

        // // find texture coordinages from source rectangle
        // // update VBO for each character
        // const x = source_rect.x / texture.width;
        // const y = source_rect.y / texture.height;

        // // where does it end
        // const x2 = x + (source_rect.w / texture.width);
        // const y2 = y + (source_rect.h / texture.height);

        // // top left 
        // this.o_texCoords[0] = x;
        // this.o_texCoords[1] = y;

        // // bottom left 
        // this.o_texCoords[2] = x;
        // this.o_texCoords[3] = y2;

        // // bottom right 
        // this.o_texCoords[4] = x2;
        // this.o_texCoords[5] = y2;

        // // bottom right 
        // this.o_texCoords[6] = x2;
        // this.o_texCoords[7] = y;


        // // texture buffer is at index 1, since it is passed as second. They are bound to index, according to order being passed in.
        // mutable_buffer.bindBuffer(1);
        // // 8 tex coords with size of 4 bytes
        // mutable_buffer.bufferSubData(this.o_texCoords, 4 * 8);
        // mutable_buffer.bind(this.m_currentRenderPassEncoder);
        // mutable_buffer.draw(this.m_currentRenderPassEncoder);

        // // this instance was used, increase the current index.
        // this.m_currentInstanceIndex++;
    }



    /**
     * @brief End the sprite rendering.
     */
    public end (): void
    {
    }
}