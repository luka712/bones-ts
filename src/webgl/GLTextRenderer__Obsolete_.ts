import { LifecycleState } from "../framework/bones_common";
import { FileLoader } from "../framework/bones_loaders";
import { Color, Mat4x4, Vec2 } from "../framework/bones_math";
import { IRenderer } from "../framework/bones_renderer";
import { BlendMode } from "../framework/SpriteRenderer";
import { TextRenderManager } from "../framework/TextRenderer";
import { WindowManager } from "../framework/Window";
import { GLGeometryBuffer } from "./GLGeometryBuffer";
import { FontType, SpriteFont } from "../framework/fonts/SpriteFont";
import { Texture2D } from "../framework/bones_texture";
import { SharedVertexBufferDescription, DrawType, SharedVertexBufferItemDescription, ComponentType, BufferUsage, IndicesBufferDescription, GeometryBuffer } from "../framework/GeometryBuffer";
import { GLTextShader } from "./shaders/GLTextShader";
import { QuadGeometry } from "../framework/bones_geometry";

/**
 * The GL text render manager.
 * NOTE: Obsolete in favor of sprite renderer.
 */
export class GLTextRenderer_Obsolete_2023_02_15 extends TextRenderManager
{
   
    private o_transform: Mat4x4;

    
    /**
     * @brief The geometry buffer. For OpenGL it might be collection of GL buffer or vertex array object.
     *
     */
     protected m_geometryBuffer: GeometryBuffer;

    /**
     * The default color.
     */
    private m_defaultColor;

    /**
     * The geometry buffer position vertices and texture coordinates.
     */
    private o_vertices: Float32Array;

    /**
     * @brief The current texture pointer. Used like this in order to avoid rebinding often.
     */
    protected o_currentTexture: Texture2D;

    /**
     * The state.
     */
    private m_state: LifecycleState;

    /**
     * The constructor.
     */
    constructor(private readonly m_gl: WebGL2RenderingContext, public readonly window: WindowManager, public readonly renderer: IRenderer, private readonly m_fileLoader: FileLoader)
    {
        super();
        this.o_transform = Mat4x4.identity();
        this.m_defaultColor = Color.white();

        window.subscribeToWindowResized((x) => 
        {
            this.resize(x.width, x.height);
        });

        this.resize(window.width, window.height);
    }

    /**
     * Set the blending mode.
     * @param { BlendMode } mode - mode
     */
    protected setBlendingMode (mode: BlendMode): void
    {
        if (mode == BlendMode.OneMinusSrcAlpha)
        {
            this.m_gl.blendFunc(this.m_gl.SRC_ALPHA, this.m_gl.ONE_MINUS_SRC_ALPHA);
            this.m_gl.enable(this.m_gl.BLEND);
        }
    }

    /**
     * @brief Initialize the text render manager. Initialize must be called in order to properly initialize all the variables.
     * @returns {  Promise<void> }
     */
    public async initialize (): Promise<void>
    {
        this.m_state = LifecycleState.Initialized;

        this.m_shader = new GLTextShader(this.m_gl, this.m_fileLoader);
        await this.m_shader.initialize();

        const geometry = new QuadGeometry();

        const attr = new SharedVertexBufferDescription();

        this.o_vertices = geometry.sharedVerticesTextureCoords;
        attr.data = this.o_vertices;
        attr.numberOfPrimitives = this.o_vertices.byteLength;
        attr.bufferUsage = BufferUsage.DYNAMIC_DRAW;
        attr.drawType = DrawType.TRIANGLES;

        const pos_attr_item = new SharedVertexBufferItemDescription();
        pos_attr_item.layoutLocation = 0;
        pos_attr_item.vertexSize = 3;
        pos_attr_item.componentType = ComponentType.FLOAT;
        pos_attr_item.offsetInBytes = 0;


        const tex_attr_item = new SharedVertexBufferItemDescription();
        tex_attr_item.layoutLocation = 1;
        tex_attr_item.vertexSize = 2;
        tex_attr_item.componentType = ComponentType.FLOAT;
        tex_attr_item.offsetInBytes = Float32Array.BYTES_PER_ELEMENT * 3;

        const indices = new IndicesBufferDescription();
        indices.data = geometry.indices;
        indices.count = 6;
        indices.componentType = ComponentType.UNSIGNED_SHORT;

        attr.sharedVertexBufferItems = [ pos_attr_item, tex_attr_item];

        this.m_geometryBuffer = new GLGeometryBuffer(this.m_gl, null, indices, attr);
    }

    public beginRenderPass<T> (data?: T): void
    {
        throw new Error("Method not implemented.");
    }

    /**
     * @brief Begins the sprite batch.
     * @param { BlendMode | null | never }
     * @returns { void }
     */
    public begin (mode: BlendMode = BlendMode.OneMinusSrcAlpha): void
    {
        this.o_currentTexture = null;
        this.setBlendingMode(mode);

        this.m_geometryBuffer.bind();

        this.m_shader.use();

        this.m_shader.useCamera(this.m_projectionMatrix, this.m_viewMatrix);
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
        let x = position[0];
        let y = position[1];

        // iterate through all characters
        const l = text.length;
        for (let i = 0; i < l; i++)
        {
            const c = text[i];
            const ch = font.getFontCharacterInfo(c);

            let pos_x = x;
            let pos_y = y;

            // TODO: scale is too high
            const w = ch.size[0] * scale;
            const h = ch.size[1] * scale;

            // update VBO for each character
            this.o_vertices[0] = pos_x;
            this.o_vertices[1] = pos_y;
            this.o_vertices[3] = 0;
            this.o_vertices[4] = 0;

            this.o_vertices[5] = pos_x;
            this.o_vertices[6] = pos_y + h;
            this.o_vertices[8] = 0;
            this.o_vertices[9] = 1;

            this.o_vertices[10] = pos_x + w;
            this.o_vertices[11] = pos_y + h;
            this.o_vertices[13] = 1;
            this.o_vertices[14] = 1;

            this.o_vertices[15] = pos_x + w;
            this.o_vertices[16] = pos_y;
            this.o_vertices[18] = 1;
            this.o_vertices[19] = 0;

            if (ch.texture != this.o_currentTexture)
            {
                this.o_currentTexture = ch.texture;
                this.o_currentTexture.bind();
            }

            this.m_geometryBuffer.bindBuffer(0);
            this.m_geometryBuffer.bufferSubData(this.o_vertices, this.o_vertices.byteLength);
            this.m_geometryBuffer.draw();

            x += ch.size[0] * scale;
        }
    }

    /**
   * Draw a string with bitmap font sprite font.   * @param { SpriteFont } font 
   * @param { string } text 
   * @param { Vec2 } position 
   * @param { number } scale 
   * @param { Color  } color 
   */
    private drawBitmapFontString (font: SpriteFont, text: string, position: Vec2, scale: number): void
    {
        if (this.o_currentTexture != font.texture)
        {
            this.o_currentTexture = font.texture;
            this.o_currentTexture.active(0);
            this.o_currentTexture.bind();
        }

        let x = Math.floor(position[0]);
        let y = Math.floor(position[1]);

        // iterate through all characters
        const l = text.length;
        for (let i = 0; i < l; i++)
        {
            const c = text[i];
            const ch = font.getFontCharacterInfo(c);

            let pos_x = x;
            let pos_y = y;

            const w = Math.floor(ch.size[0] * scale);
            const h = Math.floor(ch.size[1] * scale);

            const texels_quad = ch.textureCoords;

            // POSITIONS
            // update VBO for each character. This is for position.


            // TEXTURE COORDS
            // update VBO. This is for texels.
            this.o_vertices[0] = pos_x;
            this.o_vertices[1] = pos_y;
            this.o_vertices[3] = texels_quad.a[0];
            this.o_vertices[4] = texels_quad.a[1];

            this.o_vertices[5] = pos_x;
            this.o_vertices[6] = pos_y + h;
            this.o_vertices[8] = texels_quad.b[0];
            this.o_vertices[9] = texels_quad.b[1];

            this.o_vertices[10] = pos_x + w;
            this.o_vertices[11] = pos_y + h;
            this.o_vertices[13] = texels_quad.c[0];
            this.o_vertices[14] = texels_quad.c[1];

            this.o_vertices[15] = pos_x + w;
            this.o_vertices[16] = pos_y;
            this.o_vertices[18] = texels_quad.d[0];
            this.o_vertices[19] = texels_quad.d[1];

            this.m_geometryBuffer.bindBuffer(0);
            this.m_geometryBuffer.bufferSubData(this.o_vertices, this.o_vertices.byteLength);
            this.m_geometryBuffer.draw();

            x += Math.floor(ch.advance[0] * scale);
        }
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
        if (!color)
        {
            color = this.m_defaultColor;
        }

        this.m_shader.useColor(color);

        this.m_shader.useTransform(this.o_transform);

        if (font.fontType == FontType.GlyphCharFont)
        {
            this.drawGlyphFontString(font, text, position, scale, color);
        }
        else if (font.fontType == FontType.BitmapFont)
        {
            this.drawBitmapFontString(font, text, position, scale);
        }
        else 
        {
            throw Error(`WebGLTextRenderer::drawString: Unhandled type.`);
        }

    }

    /**
     * @brief Ends the rendering.
     * @returns { void }
     */
    public end (): void
    {

    }


    /**
     * @brief Destroy the text render manager.
     * @returns { void }
     */
    public destroy (): void
    {
        if (this.m_state != LifecycleState.Destroyed)
        {
            this.m_shader.destroy();
        }
        this.m_state = LifecycleState.Destroyed;
    }
}

