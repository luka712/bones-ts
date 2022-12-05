import { LifecycleState } from "../framework/bones_common";
import { FileLoader } from "../framework/bones_loaders";
import { Rect, Color, Mat4x4, Vec2 } from "../framework/bones_math";
import { Texture2D } from "../framework/bones_texture";
import { Vec3 } from "../framework/math/vec/Vec3";
import { Blend, BlendMode, SpriteRenderer } from "../framework/SpriteRenderer";
import { WebGPURendererContext } from "./WebGPURenderer";
import { WebGPUTexture2D } from "./textures/WebGPUTexture";
import { WebGPUSpritePipeline } from "./pipelines/WebGPUSpritePipeline";
import { IRenderer } from "../framework/bones_renderer";
import { WebGPUSpriteGeometryBuffer } from "./geometry/WebGPUSpriteGeometryBuffers";
import { SpriteFont, FontType } from "../framework/fonts/SpriteFont";

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

    /**
     * The mutable geometry buffers.
     */
    private m_mutableGeometryBuffers: Array<WebGPUSpriteGeometryBuffer> = [];

    /**
     * The index of mutable buffers.
     */
    private m_mutableBuffersIndex: number;

    /**
     * The mutable buffer for characters.
     */
    private m_charMutableGeometryBuffers: Array<WebGPUSpriteGeometryBuffer> = [];
    private m_charMutableBuffersIndex: number;

    // For optimization, so that new matrices are not created each frame.
    private o_scale: Mat4x4;
    private o_transform: Mat4x4;
    private o_rotation: Mat4x4;
    // identity is used by strings, since it's never changed
    private o_identity: Mat4x4 = Mat4x4.identity();

    // the vertices/texture coordinates.
    private o_texCoords: Float32Array;
    private o_vertices: Float32Array;

    // tint color for optimization.
    private o_defaultTintColor: Color = Color.white();

    constructor(private m_ctx: WebGPURendererContext, private readonly m_renderer: IRenderer, private readonly m_fileLoader: FileLoader)
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

        this.o_vertices = new Float32Array([
            -0.5, -0.5, 0,    		// bottom left corner
            -0.5, 0.5, 0,  	  			// top left corner
            0.5, 0.5, 0,	  			// top right corner
            0.5, -0.5, 0,	    		// bottom right corner);
        ]);
        this.m_spritePipeline = new WebGPUSpritePipeline(m_ctx, m_fileLoader);
        this.m_constantGeometryBuffer = new WebGPUSpriteGeometryBuffer(m_ctx);
    }

    /**
     * Gets the buffer instance.
     * @returns 
     */
    private getMutableBufferInstance (): WebGPUSpriteGeometryBuffer
    {
        // Find buffer to use. 
        // Since it's mutable buffer, we use approach of having separate buffer for each instance.
        if (this.m_mutableBuffersIndex >= this.m_mutableGeometryBuffers.length)
        {
            var buffer = new WebGPUSpriteGeometryBuffer(this.m_ctx);
            buffer.initialize();
            this.m_mutableGeometryBuffers.push(buffer);
        }
        const mutable_buffer = this.m_mutableGeometryBuffers[this.m_mutableBuffersIndex];
        this.m_mutableBuffersIndex++;
        return mutable_buffer;
    }

    /**
     * Gets the buffer instance.
     * @returns 
     */
    private getCharMutableBufferInstance (): WebGPUSpriteGeometryBuffer
    {
        // Find buffer to use. 
        // Since it's mutable buffer, we use approach of having separate buffer for each instance.
        if (this.m_charMutableBuffersIndex >= this.m_charMutableGeometryBuffers.length)
        {
            var buffer = new WebGPUSpriteGeometryBuffer(this.m_ctx);
            buffer.initialize();
            this.m_charMutableGeometryBuffers.push(buffer);
        }
        const mutable_buffer = this.m_charMutableGeometryBuffers[this.m_charMutableBuffersIndex];
        this.m_charMutableBuffersIndex++;
        return mutable_buffer;
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
        this.m_mutableBuffersIndex = 0;
        this.m_charMutableBuffersIndex = 0;
    }

    /**
     * @brief Begins the sprite batch.
     */
    public begin (mode?: Blend): void
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

        this.m_spritePipeline.setInstanceData(this.o_transform, tint_color ?? this.o_defaultTintColor, texture as WebGPUTexture2D);

        // bind and draw.
        this.m_constantGeometryBuffer.bind();
        this.m_constantGeometryBuffer.draw();
    }

    public drawSource (texture: Texture2D, draw_rect: Rect, source_rect: Rect, tint_color?: Color, axis_of_rotation?: Vec3, rotation_in_radians?: number): void
    {
        const mutable_buffer = this.getMutableBufferInstance();

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

        this.m_spritePipeline.setInstanceData(this.o_transform, tint_color ?? this.o_defaultTintColor, texture as WebGPUTexture2D);

        // bind and draw.
        mutable_buffer.bind();
        mutable_buffer.setTexCoords(this.o_texCoords);
        mutable_buffer.draw();
    }

    /**
     * Draw a string with bitmap font sprite font.   * @param { SpriteFont } font 
     * @param { string } text 
     * @param { Vec2 } position 
     * @param { number } scale 
     * @param { Color  } color 
     */
    private drawBitmapFontString (font: SpriteFont, text: string, position: Vec2, scale: number, color: Color): void
    {

        let x = Math.floor(position[0]);
        let y = Math.floor(position[1]);

        // iterate through all characters
        const l = text.length;
        for (let i = 0; i < l; i++)
        {
            const c = text[i];
            const ch = font.getFontCharacterInfo(c);

            const mutable_buffer =this.getCharMutableBufferInstance();

            let pos_x = x;
            let pos_y = y;

            const w = ch.size[0] * scale;
            const h = ch.size[1] * scale;

            const texels_quad = ch.textureCoords;

            // POSITIONS
            // update VBO for each character. This is for position.
            // 0
            this.o_vertices[0] = pos_x;
            this.o_vertices[1] = pos_y;
            // 1
            this.o_vertices[3] = pos_x;
            this.o_vertices[4] = pos_y + h;
            // 2
            this.o_vertices[6] = pos_x + w;
            this.o_vertices[7] = pos_y + h;
            // 3
            this.o_vertices[9] = pos_x + w;
            this.o_vertices[10] = pos_y;

            // TEXTURE COORDS
            // update VBO. This is for texels.
            // 0
            this.o_texCoords[0] = texels_quad.a[0];
            this.o_texCoords[1] = texels_quad.a[1];
            // 1
            this.o_texCoords[2] = texels_quad.b[0];
            this.o_texCoords[3] = texels_quad.b[1];
            // 2
            this.o_texCoords[4] = texels_quad.c[0];
            this.o_texCoords[5] = texels_quad.c[1];
            // 3
            this.o_texCoords[6] = texels_quad.d[0];
            this.o_texCoords[7] = texels_quad.d[1];

            // bind and draw.
            this.m_spritePipeline.setInstanceData(this.o_identity, color ?? this.o_defaultTintColor, font.texture as WebGPUTexture2D);

            mutable_buffer.bind();
            mutable_buffer.setVerticesAndTexCoords(this.o_vertices, this.o_texCoords);
            mutable_buffer.draw();

            x += Math.floor(ch.advance[0] * scale);
        }
    }

    /**
  * Draw a string with glyph type sprite font.
  * @param { SpriteFont } font 
  * @param { string } text 
  * @param { Vec2 } position 
  * @param { number  } scale 
  * @param { Color  } color 
  */
    private drawGlyphFontString (font: SpriteFont, text: string, position: Vec2, scale: number, color: Color): void
    {
        throw new Error("Not implemented!");
        // let x = position[0];
        // let y = position[1];

        // // iterate through all characters
        // const l = text.length;
        // for (let i = 0; i < l; i++)
        // {
        //     const c = text[i];
        //     const ch = font.getFontCharacterInfo(c);

        //     let pos_x = x;
        //     let pos_y = y;

        //     // TODO: scale is too high
        //     const w = ch.size[0] * scale;
        //     const h = ch.size[1] * scale;

        //     // update VBO for each character
        //     this.o_vertices[0] = pos_x;
        //     this.o_vertices[1] = pos_y;
        //     this.o_vertices[3] = 0;
        //     this.o_vertices[4] = 0;

        //     this.o_vertices[5] = pos_x;
        //     this.o_vertices[6] = pos_y + h;
        //     this.o_vertices[8] = 0;
        //     this.o_vertices[9] = 1;

        //     this.o_vertices[10] = pos_x + w;
        //     this.o_vertices[11] = pos_y + h;
        //     this.o_vertices[13] = 1;
        //     this.o_vertices[14] = 1;

        //     this.o_vertices[15] = pos_x + w;
        //     this.o_vertices[16] = pos_y;
        //     this.o_vertices[18] = 1;
        //     this.o_vertices[19] = 0;

        //     if (ch.texture != this.o_currentTexture)
        //     {
        //         this.o_currentTexture = ch.texture;
        //         this.o_currentTexture.bind();
        //     }

        //     this.m_geometryBuffer.bindBuffer(0);
        //     this.m_geometryBuffer.bufferSubData(this.o_vertices, this.o_vertices.byteLength);
        //     this.m_geometryBuffer.draw();

        //     x += ch.size[0] * scale;
        // }
    }



    /**
     * Draw a string.
     * @param { SpriteFont } font 
     * @param { string } text 
     * @param { Vec2 } position 
     * @param { number | null | never } scale - by default set to 1. This means that font is renderer in it's natural size.
     * @param { Color | null | never } color - by default white.
     */
    public drawString (font: SpriteFont, text: string, position: Vec2, scale: number = 1, color?: Color): void
    {
        if (font.fontType == FontType.GlyphCharFont)
        {
            this.drawGlyphFontString(font, text, position, scale, color);
        }
        else if (font.fontType == FontType.BitmapFont)
        {
            this.drawBitmapFontString(font, text, position, scale, color);
        }
        else 
        {
            throw Error(`WebGLTextRenderer::drawString: Unhandled type.`);
        }

    }


    /**
     * @brief End the sprite rendering.
     */
    public end (): void
    {
    }
}