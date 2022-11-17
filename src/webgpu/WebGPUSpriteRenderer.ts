import { LifecycleState } from "../framework/bones_common";
import { QuadGeometry } from "../framework/bones_geometry";
import { FileLoader } from "../framework/bones_loaders";
import { Rect, Color, Mat4x4 } from "../framework/bones_math";
import { Texture2D } from "../framework/bones_texture";
import { VertexBufferDescription, ComponentType, IndicesBufferDescription } from "../framework/GeometryBuffer";
import { Vec3 } from "../framework/math/vec/Vec3";
import { BlendMode, SpriteRenderer } from "../framework/SpriteRenderer";
import { GPUSpriteShader } from "./gpu_shader/GPUSpriteShader";
import { WebGPUGeometryBuffer } from "./WebGPUGeometryBuffer";
import { WebGPURenderer } from "./WebGPURenderer";

/**
 * The WebGPU sprite renderer.
 */
export class WebGPUSpriteRenderer extends SpriteRenderer
{
    public drawSource (texture: Texture2D, draw_rect: Rect, source_rect: Rect, tint_color?: Color, axis_of_rotation?: Vec3, rotation_in_radians?: number): void
    {
        throw new Error("Method not implemented.");
    }
  
    /**
     * The render pass encoder, needs to be passed in, so that items can be prepared for drawing.
     */
    private m_currentRenderPassEncoder: GPURenderPassEncoder;

    private m_currentInstanceIndex: number = 0;

    // For optimization, so that new matrices are not created each frame.
    private o_scale: Mat4x4;
    private o_transform: Mat4x4;
    private o_rotation: Mat4x4;

    // tint color for optimization.
    private o_defaultTintColor: Color = Color.white();

    constructor(private readonly m_renderer: WebGPURenderer, private readonly m_fileLoader: FileLoader)
    {
        super();

        this.o_scale = Mat4x4.identity();
        this.o_transform = Mat4x4.identity();
        this.o_rotation = Mat4x4.identity();
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

        this.m_shader = new GPUSpriteShader(this.m_renderer.device, this.m_fileLoader);
        await this.m_shader.initialize();

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

        const indices = new IndicesBufferDescription();
        indices.data = quad_geometry.indices;
        indices.count = quad_geometry.indicesCount;
        indices.componentType = ComponentType.UNSIGNED_SHORT;

        this.m_geometryBuffer = new WebGPUGeometryBuffer(this.m_renderer.device, [position_attr, texture_coords_attr], indices);

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
    }

    /**
     * @brief Begins the sprite batch.
     */
    public begin (mode?: BlendMode): void
    {
        // bind the geometry first.
        this.m_geometryBuffer.bind(this.m_currentRenderPassEncoder);

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

        // TODO: Handle texture.



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

        this.m_shader.useTransform(this.o_transform);
        this.m_shader.useTintColor(tint_color ?? this.o_defaultTintColor);

        this.m_geometryBuffer.draw(this.m_currentRenderPassEncoder);

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