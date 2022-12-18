import { text } from "stream/consumers";
import { LifecycleState } from "../framework/bones_common";
import { QuadGeometry } from "../framework/bones_geometry";
import { FileLoader } from "../framework/bones_loaders";
import { Rect, Color, Mat4x4, Vec2 } from "../framework/bones_math";
import { Texture2D } from "../framework/bones_texture";
import { VertexBufferDescription, ComponentType, IndicesBufferDescription, BufferUsage } from "../framework/GeometryBuffer";
import { Vec3 } from "../framework/math/vec/Vec3";
import { Blend, BlendMode, SpriteRenderer } from "../framework/SpriteRenderer";
import { GPUSpriteShader } from "./gpu_shader/GPUSpriteShader";
import { WebGPUGeometryBuffer } from "./WebGPUGeometryBuffer";
import { WebGPURenderer } from "./WebGPURenderer";
import { WebGPUTexture2D } from "./textures/WebGPUTexture";

/**
 * The WebGPU sprite renderer.
 */
export class WebGPUSpriteRendererObsolete extends SpriteRenderer
{
    public drawOnPosition (texture: Texture2D, position: Vec2, tint_color?: Color, rotation_in_radians?: number, origin?: Vec2): void
    {
        throw new Error("Method not implemented.");
    }
    /**
     * The render pass encoder, needs to be passed in, so that items can be prepared for drawing.
     */
    private m_currentRenderPassEncoder: GPURenderPassEncoder;

    private m_currentInstanceIndex: number = 0;

    /**
     * Buffer which does not need to be modified. 
     * Used when texture coordinates don't need to be modified.
     * For example, usage with:
     * draw
     */
    private m_constantGeometryBuffer: WebGPUGeometryBuffer;

    /**
     * Used when subdata( texture data) needs to be modified.
     * For example usage with: 
     * drawSource
     * drawString
     */
    private m_mutableGeometryBuffers: Array<WebGPUGeometryBuffer> = [];
    /** to keep track of which buffer is used currently. */
    private m_mutableGeometryBufferInstanceIndex: number;

    // For optimization, so that new matrices are not created each frame.
    private o_scale: Mat4x4;
    private o_transform: Mat4x4;
    private o_rotation: Mat4x4;

    // the texture coordinates.
    private o_texCoords: Float32Array;

    // tint color for optimization.
    private o_defaultTintColor: Color = Color.white();

    constructor(private readonly m_renderer: WebGPURenderer, private readonly m_fileLoader: FileLoader)
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
    }

    /**
       * @brief Set the Blending Mode for sprite batch.
       *
       * @param { BlendMode } mode
       * @returns { void }
       */
    protected setBlendingMode (mode: Blend): void
    {

    }

    /**
     * Creates the {@link WebGPUGeometryBuffer}.
     */
    private createGeometryBuffer (is_dynamic: boolean): WebGPUGeometryBuffer 
    {
        const quad_geometry = new QuadGeometry();

        const position_attr = new VertexBufferDescription();
        position_attr.data = quad_geometry.vertices;
        position_attr.count = quad_geometry.verticesCount;
        position_attr.isPositionBuffer = true;
        position_attr.layoutLocation = 0;
        position_attr.vertexSize = 3;
        position_attr.componentType = ComponentType.FLOAT;

        const texture_coords_attr = new VertexBufferDescription();
        texture_coords_attr.data = quad_geometry.textureCoords;
        texture_coords_attr.count = quad_geometry.textureCoordsCount;
        texture_coords_attr.isPositionBuffer = false;
        texture_coords_attr.layoutLocation = 1;
        texture_coords_attr.vertexSize = 2;
        texture_coords_attr.componentType = ComponentType.FLOAT;
        texture_coords_attr.bufferUsage = is_dynamic ? BufferUsage.DYNAMIC_DRAW : BufferUsage.STATIC_DRAW;

        const indices = new IndicesBufferDescription();
        indices.data = quad_geometry.indices;
        indices.count = quad_geometry.indicesCount;
        indices.componentType = ComponentType.UNSIGNED_SHORT;

        return new WebGPUGeometryBuffer(this.m_renderer, [position_attr, texture_coords_attr], indices);
    }

    /**
     * @brief Initialize the sprite batch manager. Initialize must be called in order to properly initialize all the variables.
     */
    public async initialize (): Promise<void>
    {
        this.m_state = LifecycleState.Initialized;

        this.m_shader = new GPUSpriteShader(this.m_renderer.device, this.m_fileLoader);
        await this.m_shader.initialize();

        this.m_constantGeometryBuffer = this.createGeometryBuffer(false);

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
        this.m_currentRenderPassEncoder = data as GPURenderPassEncoder;
        this.m_currentInstanceIndex = 0;
        this.m_mutableGeometryBufferInstanceIndex = 0;
    }

    /**
     * @brief Begins the sprite batch.
     */
    public begin (mode?: Blend): void
    {
        // then use shader and bind per pass cameras.
        this.m_shader.use(this.m_currentRenderPassEncoder);
        this.m_shader.useCamera(this.m_projectionMatrix, this.m_viewMatrix);
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
        // bind the current instance
        this.m_shader.bindInstance(this.m_currentInstanceIndex);

        const offset_x = draw_rect.w * 0.5;
        const offset_y = draw_rect.h * 0.5;

        // First get required matrices.
        Mat4x4.scaleMatrix(draw_rect.w, draw_rect.h, 1.0, this.o_scale);
        if (axis_of_rotation && rotation_in_radians)
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

        this.m_shader.useTransform(this.o_transform);
        this.m_shader.useTintColor(tint_color ?? this.o_defaultTintColor);
        (this.m_shader as GPUSpriteShader).useSpriteTexture(texture as WebGPUTexture2D);

        // bind and draw.
        this.m_constantGeometryBuffer.bind(this.m_currentRenderPassEncoder);
        this.m_constantGeometryBuffer.draw(this.m_currentRenderPassEncoder);

        // this instance was used, increase the current index.
        this.m_currentInstanceIndex++;
    }

    public drawSource (texture: Texture2D, draw_rect: Rect, source_rect: Rect, tint_color?: Color, axis_of_rotation?: Vec3, rotation_in_radians?: number): void
    {
        // Find buffer to use. 
        // Since it's mutable buffer, we use approach of having separate buffer for each instance.
        if (this.m_mutableGeometryBufferInstanceIndex >= this.m_mutableGeometryBuffers.length)
        {
            this.m_mutableGeometryBuffers.push(this.createGeometryBuffer(true));
        }
        const mutable_buffer = this.m_mutableGeometryBuffers[this.m_mutableGeometryBufferInstanceIndex];
        this.m_mutableGeometryBufferInstanceIndex++;


        // bind the current instance
        this.m_shader.bindInstance(this.m_currentInstanceIndex);

        const offset_x = draw_rect.w * 0.5;
        const offset_y = draw_rect.h * 0.5;

        // First get required matrices.
        Mat4x4.scaleMatrix(draw_rect.w, draw_rect.h, 1.0, this.o_scale);
        if (axis_of_rotation && rotation_in_radians )
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

        this.m_shader.useTransform(this.o_transform);
        this.m_shader.useTintColor(tint_color ?? this.o_defaultTintColor);
        (this.m_shader as GPUSpriteShader).useSpriteTexture(texture as WebGPUTexture2D);

        // find texture coordinages from source rectangle
        // update VBO for each character
        const x = source_rect.x / texture.width;
        const y = source_rect.y / texture.height;

        // where does it end
        const x2 = x + (source_rect.w / texture.width);
        const y2 = y + (source_rect.h / texture.height);

        // top left 
        this.o_texCoords[0] = x;
        this.o_texCoords[1] = y;

        // bottom left 
        this.o_texCoords[2] = x;
        this.o_texCoords[3] = y2;

        // bottom right 
        this.o_texCoords[4] = x2;
        this.o_texCoords[5] = y2;

        // bottom right 
        this.o_texCoords[6] = x2;
        this.o_texCoords[7] = y;


        // texture buffer is at index 1, since it is passed as second. They are bound to index, according to order being passed in.
        mutable_buffer.bindBuffer(1);
        // 8 tex coords with size of 4 bytes
        mutable_buffer.bufferSubData(this.o_texCoords, 4 * 8);
        mutable_buffer.bind(this.m_currentRenderPassEncoder);
        mutable_buffer.draw(this.m_currentRenderPassEncoder);

        // this instance was used, increase the current index.
        this.m_currentInstanceIndex++;
    }



    /**
     * @brief End the sprite rendering.
     */
    public end (): void
    {
    }
}