import { LifecycleState } from "../framework/bones_common";
import { QuadGeometry } from "../framework/bones_geometry";
import { FileLoader } from "../framework/bones_loaders";
import { IRenderer } from "../framework/bones_renderer";
import { Blend, BlendFactor, BlendMode, SpriteRenderer } from "../framework/SpriteRenderer";
import { Texture2D } from "../framework/bones_texture";
import { WindowManager } from "../framework/Window";
import { Mat4x4 } from "../framework/math/mat/Mat4x4";
import { Rect } from "../framework/math/Rect";
import { Vec3 } from "../framework/math/vec/Vec3";
import { GLGeometryBuffer, } from "./GLGeometryBuffer";
import { Color, Vec2 } from "../framework/bones_math";
import { GLSpriteShader } from "./shaders/GLSpriteShader";
import { VertexBufferDescription, ComponentType, IndicesBufferDescription, BufferUsage } from "../framework/GeometryBuffer";

export class GLSpriteRenderer extends SpriteRenderer
{
    // For optimization, so that new matrices are not created each frame.
    private o_scale: Mat4x4;
    private o_transform: Mat4x4;
    private o_rotation: Mat4x4;

    // tint color for optimization.
    private o_defaultTintColor: Color = Color.white();


    /**
     * The constant buffer, which does not change data.
     * Use it to avoid calling buffer sub data often.
     */
    private m_constantBuffer: GLGeometryBuffer;

    /**
     * The mutable buffer, which changes data often.
     */
    private m_mutableBuffer: GLGeometryBuffer;

    /**
    * The geometry buffer texture coordinates.
    * Used when buffering data with 'draw' or 'drawSource'.
    * Used to avoid declaring new array on 'draw' or 'drawSource'.
    */
    private o_texCoords: Float32Array;

    /**
     * @brief The current texture pointer. Used like this in order to avoid rebinding often.
     */
    protected o_currentTexture?: Texture2D;


    constructor(private m_gl: WebGL2RenderingContext, public readonly window: WindowManager, public readonly renderer: IRenderer, private m_fileLoader: FileLoader)
    {
        super();
        this.o_transform = Mat4x4.identity();
        this.o_scale = Mat4x4.identity();
        this.o_rotation = Mat4x4.identity();
        this.o_defaultTintColor.a = 1;

        this.window.subscribeToWindowResized((e) => 
        {
            this.resize(e.width, e.height);
        });

        // initial or default state
        this.o_texCoords = new Float32Array([
            0, 0,
            0, 1,
            1, 1,
            1, 0
        ]);

        this.resize(window.width, window.height);
    }

    /**
    * {@inheritDoc SpriteRenderer}
    */
    protected setBlendingMode (mode?: Blend): void
    {
        let source = this.m_gl.SRC_ALPHA;
        let dest = this.m_gl.ONE_MINUS_SRC_ALPHA;

        if (mode)
        {
            let source = this.m_gl.SRC_ALPHA;
            let dest = this.m_gl.ONE_MINUS_SRC_ALPHA;

            switch (mode.srcFactor)
            {
                case BlendFactor.SRC_ALPHA:
                    source = this.m_gl.SRC_ALPHA;
                    break;
                case BlendFactor.ONE_MINUS_SRC_ALPHA:
                    source = this.m_gl.ONE_MINUS_SRC_ALPHA;
                    break;
                case BlendFactor.ONE:
                    source = this.m_gl.ONE;
                    break;
                default:
                    throw new Error("GLSpriteRenderer::setBlendingMode:  Unable to resolve source blending mode!");
            }

            switch (mode.destFactor)
            {
                case BlendFactor.SRC_ALPHA:
                    dest = this.m_gl.SRC_ALPHA;
                    break;
                case BlendFactor.ONE_MINUS_SRC_ALPHA:
                    dest = this.m_gl.ONE_MINUS_SRC_ALPHA;
                    break;
                case BlendFactor.ONE:
                    dest = this.m_gl.ONE;
                    break;
                default:
                    throw new Error("GLSpriteRenderer::setBlendingMode:  Unable to resolve destination blending mode!");

            }


            this.m_gl.blendFunc(source, dest);
            this.m_gl.enable(this.m_gl.BLEND);
        }
    }

    /**
     * @brief Initialize the sprite batch manager. Initialize must be called in order to properly initialize all the variables.
     */
    public async initialize (): Promise<void>
    {
        this.m_state = LifecycleState.Initialized;

        this.m_shader = new GLSpriteShader(this.m_gl, this.m_fileLoader);
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

        this.m_constantBuffer = new GLGeometryBuffer(this.m_gl, [position_attr, texture_coords_attr], indices);
        texture_coords_attr.bufferUsage = BufferUsage.DYNAMIC_DRAW;
        this.m_mutableBuffer = new GLGeometryBuffer(this.m_gl, [position_attr, texture_coords_attr], indices);
    }

    /**
     * @brief Destroy the sprite batch manager.
     */
    public destroy (): void
    {
        this.m_shader.destroy();
    }

    /**
     * Called when render pass has begun. For WebGL2 it's not relevant yet. So do nothing.
     * @param { T } data 
     */
    public beginRenderPass<T> (data: T): void
    {
        // do nothing.
    }

    /**
   * {@inheritDoc SpriteRenderer}
   */
    public begin (mode?: Blend): void
    {
        this.o_currentTexture = null;
        this.setBlendingMode(mode);

        this.m_shader.use();

        this.m_shader.useCamera(this.m_projectionMatrix, this.m_viewMatrix);
    }

    /**
     * {@inheritDoc SpriteRenderer}
     */
    public draw (texture: Texture2D, draw_rect: Rect, tint_color: Color, axis_of_rotation?: Vec3, rotation_in_radians?: number, origin?: Vec2): void
    {
        if (texture != this.o_currentTexture)
        {
            this.o_currentTexture = texture;
            this.m_shader.useSpriteTexture(texture);
        }

        let offset_x = draw_rect.w * 0.5;
        let offset_y = draw_rect.h * 0.5;

        if (origin)
        {
            offset_x -= draw_rect.w * origin[0];
            offset_y -= draw_rect.h * origin[1];
        }

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

        this.m_constantBuffer.bind();
        this.m_constantBuffer.draw();
    }

    /**
     * Draw the texture part specifed by source rectangle at specified draw rectangle, with optional tint color and rotation values.
     * To be used when part of texture needs to be drawn.
     * 
     * @param { Texture2D } texture - which texture to draw.
     * @param { Rect } draw_rect - the drawing rectangle
     * @param { Rect } source_rect - defines which part from texture to select.
     * @param { Vec2|undefined } tint_color - the color to be used as tint color. 
     * @param { Vec3|undefined } axis_of_rotation - if sprites needs to be rotated around arbitrary axis.
     * @param { number|undefined} rotation_in_radians - how much to rotate, in radians.
     */
    public drawSource (texture: Texture2D, draw_rect: Rect, source_rect: Rect, tint_color?: Color, axis_of_rotation?: Vec3, rotation_in_radians?: number): void
    {
        if (texture != this.o_currentTexture)
        {
            this.o_currentTexture = texture;
            this.m_shader.useSpriteTexture(texture);
        }

        const offset_x = draw_rect.w * 0.5;
        const offset_y = draw_rect.h * 0.5;

        // First get required matrices.
        Mat4x4.scaleMatrix(draw_rect.w, draw_rect.h, 1.0, this.o_scale);
        // !! if rotation in radians is anything besides 0
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

        this.m_mutableBuffer.bind();

        // texture buffer is at index 1, since it is passed as second. They are bound to index, according to order being passed in.
        this.m_mutableBuffer.bindBuffer(1);
        // 8 tex coords with size of 4 bytes
        this.m_mutableBuffer.bufferSubData(this.o_texCoords, 4 * 8);
        this.m_mutableBuffer.draw();
    }

    /**
     * @brief End the sprite rendering.
     */
    public end (): void { }
}
