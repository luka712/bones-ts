import { LifecycleState } from "../../../framework/bones_common";
import { FileLoader } from "../../../framework/bones_loaders";
import { IRenderer } from "../../../framework/bones_renderer";
import { Blend, SpriteRenderer } from "../../../framework/SpriteRenderer";
import { Texture2D } from "../../../framework/bones_texture";
import { WindowManager } from "../../../framework/Window";
import { Rect } from "../../../framework/math/Rect";
import { Color, Vec2 } from "../../../framework/bones_math";
import { GLBlendModeUtil } from "../common/GLBlendModeUtil";
import { GLShaderImplementation } from "../../shaders/GLShaderImplementation";
import  vertexSource  from "./shaders/vspriteshader.glsl?raw"
import  fragmentSource  from "./shaders/fspriteshader.glsl?raw"




// in order to optimize, sprite renderer will render with really large buffer that needs to be setup properly
// buffer will support configurable number of instances.
const NUM_MAX_INSTANCES = 1000;
// pos3, tc2, color4
const STRIDE = 3 * Float32Array.BYTES_PER_ELEMENT + 2 * Float32Array.BYTES_PER_ELEMENT + 4 * Float32Array.BYTES_PER_ELEMENT;

//************* WORKS AS FOLLOWS ***********************/
// create big buffer that holds vertices and indices
// instance data is written into buffer
// if begin() is called instance count is restarted and data needs to be drawn
// if texture is changed, instance count is restarted and data needs to be drawn
// otherwise write into giant buffer until max count 
// if max count is hit, restart instnace count and draw


export class GLSpriteRenderer extends SpriteRenderer
{
    // WEBGL allocated data.
    private m_vao: WebGLVertexArrayObject; // actually used.
    private m_buffer: WebGLBuffer; // keep only to clean it up
    private m_iBuffer: WebGLBuffer // keep only to clean it up

    // Shader stuff
    private m_shader: GLShaderImplementation;
    private m_projectionViewMatrixLocation: WebGLUniformLocation;

    // The big buffer that holds all the data.
    private m_data: Float32Array;
    // index of current instance. Must be less then NUM_MAX_INSTANCES
    private m_currentInstanceIndex = 0;
    // the current texure
    private m_currentTexture?: Texture2D;

    // tint color for optimization.
    private o_defaultTintColor: Color = Color.white();

    private o_defaultBlend = Blend.nonPremultiplied();

    // Optimization vector, when passing to buffer.
    private o_v0: Vec2 = Vec2.zero();
    private o_v1: Vec2 = Vec2.zero();
    private o_v2: Vec2 = Vec2.zero();
    private o_v3: Vec2 = Vec2.zero();
    private o_rotOrigin: Vec2 = Vec2.zero();

    constructor(private m_gl: WebGL2RenderingContext, public readonly window: WindowManager, public readonly renderer: IRenderer, private m_fileLoader: FileLoader)
    {
        super();

        this.window.subscribeToWindowResized((e) => 
        {
            this.resize(e.width, e.height);
        });

        this.resize(window.width, window.height);
    }


    /**
     * Creates and returns the data arrays.
     */
    private createDataArrays (): { indices: Uint32Array, data: Float32Array }
    {
        const indices = new Uint32Array(NUM_MAX_INSTANCES * 6); // 6 for quad indices
        const data = new Float32Array(NUM_MAX_INSTANCES * STRIDE); // 4 for quad, pos_v3 * 4 + tex_v2 * 4 + color_v4 * 4

        let i_index = 0;
        for (let i = 0; i < NUM_MAX_INSTANCES * 6; i += 6)
        {
            // Should be something like
            // 0, 1, 2, first triangle (bottom left - top left - top right)
            // 0, 2, 3  second triangle (bottom left - top right - bottom right))

            // first triangle
            indices[i] = i_index;
            indices[i + 1] = i_index + 1;
            indices[i + 2] = i_index + 2;

            // second triangle
            indices[i + 3] = i_index;
            indices[i + 4] = i_index + 2;
            indices[i + 5] = i_index + 3;

            i_index += 4;
        }

        this.m_data = data;

        return { indices, data }
    }

    /**
     * Creates the vao object and buffers.
     */
    private initializeWebGLVaoAndBuffers (): void 
    {
        const gl = this.m_gl;

        const data = this.createDataArrays();

        // create vertex array object, which holds buffers.
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // create index buffer.
        const i_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, i_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices, gl.STATIC_DRAW); // STATIC_DRAW - only needs to be set once.

        // create position and vertices buffer
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data.data, gl.DYNAMIC_DRAW); // DYNAMIC_DRAW - will be set and used often. 

        // positions. Layout location = 0
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, STRIDE, 0);
        gl.enableVertexAttribArray(0);

        // textures. Layout location = 1
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, STRIDE, 3 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(1);

        // tint color. Layout location = 2
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, STRIDE, 3 * Float32Array.BYTES_PER_ELEMENT + 2 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(2);

        // unbind vao.
        gl.bindVertexArray(null);

        this.m_vao = vao;
        this.m_buffer = buffer;
        this.m_iBuffer = i_buffer;
    }

    private async initializeShaders (): Promise<void>
    {
        const shader = new GLShaderImplementation(this.m_gl, vertexSource, fragmentSource);

        await shader.initialize();
        // await shader.initialize(vertex_source, fragment_source);

        this.m_projectionViewMatrixLocation = shader.getUniformLocation("u_global.projectionViewMatrix", true);

        this.m_shader = shader;
    }

    /**
     * @brief Initialize the sprite batch manager. Initialize must be called in order to properly initialize all the variables.
     */
    public async initialize (): Promise<void>
    {
        this.m_state = LifecycleState.Initialized;
        this.initializeWebGLVaoAndBuffers();
        this.initializeShaders();
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
     * Call gl to draw. 
     */
    private glDraw (): void 
    {
        const gl = this.m_gl;

        // buffer subdata
        gl.bindBuffer(gl.ARRAY_BUFFER, this.m_buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.m_data, 0, this.m_currentInstanceIndex * STRIDE);

        // draw
        gl.drawElements(gl.TRIANGLES, this.m_currentInstanceIndex * 6, gl.UNSIGNED_INT, 0);

        // reset index.
        this.m_currentInstanceIndex = 0;
    }

    /**
     * Handles the texture and changes it to current if neccessary.
     * If texture is change, current instnace is reset to 0.
     * Also sets texture to shader
     * .
     * @param texture 
     */
    private handleTexture (texture: Texture2D): void 
    {
        if (texture != this.m_currentTexture)
        {
            // texture is changed, must draw
            this.glDraw();

            // change texture.
            this.m_currentTexture = texture;
            // set active texture unit and bind texture.
            texture.active(0);
            texture.bind();
        }
    }

    /**
     * {@inheritDoc SpriteRenderer}
     */
    public begin (mode?: Blend): void
    {
        const gl = this.m_gl;

        // reset stuff.
        this.m_currentTexture = null;
        this.m_currentInstanceIndex = 0;

        GLBlendModeUtil.setBlendMode(gl, mode ?? this.o_defaultBlend);

        // bind vao
        gl.bindVertexArray(this.m_vao);

        this.m_shader.use();
        gl.uniformMatrix4fv(this.m_projectionViewMatrixLocation, false, this.m_projectionViewMatrix);
    }

    /**
     * Draw inner is just helper function to lower code reuse. Increases the current index on each draw.
     * @param i - pass here index multiplied by stride: this.m_currentInstanceIndex * STRIDE
     * @param x - the x position
     * @param y - the y position
     * @param w - the sprite width
     * @param h - the sprite height
     * @param rotation_in_radians - rotation theta
     * @param rotation_anchor - rotation anchor
     * @param tint_color - tint color
     */
    private drawInner (i: number, x: number, y: number, w: number, h: number,
        rotation_in_radians: number, rotation_anchor?: Vec2, tint_color?: Color): void 
    {
        const d = this.m_data;

        x += w * .5;
        y += h * .5;

        // bottom left corner
        this.o_v0[0] = x;
        this.o_v0[1] = y;

        // top left corner
        this.o_v1[0] = x;
        this.o_v1[1] = y + h;

        // top right corner
        this.o_v2[0] = x + w;
        this.o_v2[1] = y + h;

        // bottom right corner.
        this.o_v3[0] = x + w;
        this.o_v3[1] = y;

        // rotate 
        if (rotation_in_radians)
        {
            // TOP LEFT CORNER BY DEFAULT.
            this.o_rotOrigin[0] = x + w * this.rotationAnchor[0];
            this.o_rotOrigin[1] = y + h * this.rotationAnchor[1];

            // correct of origin is present.
            if (rotation_anchor)
            {
                this.o_rotOrigin[0] += w * rotation_anchor[0];
                this.o_rotOrigin[1] += h * rotation_anchor[1];
            }

            this.o_v0.rotateAroundPoint(this.o_rotOrigin, rotation_in_radians);
            this.o_v1.rotateAroundPoint(this.o_rotOrigin, rotation_in_radians);
            this.o_v2.rotateAroundPoint(this.o_rotOrigin, rotation_in_radians);
            this.o_v3.rotateAroundPoint(this.o_rotOrigin, rotation_in_radians);
        }

        // use default if not set.
        tint_color = tint_color ?? this.o_defaultTintColor;

        // -0.5, -0.5, 0, 0, 0,			// bottom left corner
        // v0
        d[i] = this.o_v0[0];
        d[i + 1] = this.o_v0[1];
        d[i + 2] = 0;
        // tc0
        d[i + 3] = 0;
        d[i + 4] = 0;
        // color0
        d[i + 5] = tint_color.r;
        d[i + 6] = tint_color.g;
        d[i + 7] = tint_color.b;
        d[i + 8] = tint_color.a;

        // -0.5, 0.5, 0, 0, 1,			// top left corner
        // v1
        d[i + 9] = this.o_v1[0];
        d[i + 10] = this.o_v1[1];
        d[i + 11] = 0;
        // tc1
        d[i + 12] = 0;
        d[i + 13] = 1;
        // color1
        d[i + 14] = tint_color.r;
        d[i + 15] = tint_color.g;
        d[i + 16] = tint_color.b;
        d[i + 17] = tint_color.a;

        // 0.5, 0.5, 0, 1, 1,			// top right corner
        // v2
        d[i + 18] = this.o_v2[0];
        d[i + 19] = this.o_v2[1];
        d[i + 20] = 0;
        // tc2
        d[i + 21] = 1;
        d[i + 22] = 1;
        // color2
        d[i + 23] = tint_color.r;
        d[i + 24] = tint_color.g;
        d[i + 25] = tint_color.b;
        d[i + 26] = tint_color.a;

        // 0.5, -0.5, 0, 1, 0			// bottom right corner
        // v3
        d[i + 27] = this.o_v3[0];
        d[i + 28] = this.o_v3[1];
        d[i + 29] = 0;
        // tc3
        d[i + 30] = 1;
        d[i + 31] = 0;
        // color3
        d[i + 32] = tint_color.r;
        d[i + 33] = tint_color.g;
        d[i + 34] = tint_color.b;
        d[i + 35] = tint_color.a;

        this.m_currentInstanceIndex++;
    }

    /**
     * Draw inner is just helper function to lower code bloat. Increases the current index on each draw.
     * @param i - pass here index multiplied by stride: this.m_currentInstanceIndex * STRIDE
     * @param x - the x position
     * @param y - the y position
     * @param w - the sprite width
     * @param h - the sprite height
     * @param sourceRect - the source rectangle.
     * @param rotation_in_radians - rotation theta
     * @param rotation_anchor - rotation anchor
     * @param tint_color - tint color
     */
    private drawInnerSource (i: number,
        x: number, y: number, w: number, h: number,
        sourceRect: Rect,
        rotation_in_radians: number, rotation_anchor?: Vec2, tint_color?: Color): void 
    {
        const d = this.m_data;

        // bottom left corner
        this.o_v0[0] = x;
        this.o_v0[1] = y;

        // top left corner
        this.o_v1[0] = x;
        this.o_v1[1] = y + h;

        // top right corner
        this.o_v2[0] = x + w;
        this.o_v2[1] = y + h;

        // bottom right corner.
        this.o_v3[0] = x + w;
        this.o_v3[1] = y;

        // rotate 
        if (rotation_in_radians)
        {
            // TOP LEFT CORNER BY DEFAULT.
            this.o_rotOrigin[0] = x + w * this.rotationAnchor[0];
            this.o_rotOrigin[1] = y + h * this.rotationAnchor[1];

            // correct of origin is present.
            if (rotation_anchor)
            {
                this.o_rotOrigin[0] += w * rotation_anchor[0];
                this.o_rotOrigin[1] += h * rotation_anchor[1];
            }

            this.o_v0.rotateAroundPoint(this.o_rotOrigin, rotation_in_radians);
            this.o_v1.rotateAroundPoint(this.o_rotOrigin, rotation_in_radians);
            this.o_v2.rotateAroundPoint(this.o_rotOrigin, rotation_in_radians);
            this.o_v3.rotateAroundPoint(this.o_rotOrigin, rotation_in_radians);
        }

        // use default if not set.
        tint_color = tint_color ?? this.o_defaultTintColor;

        const tx = sourceRect.x / this.m_currentTexture.width;
        const ty = sourceRect.y / this.m_currentTexture.height;

        const tx2 = tx + (sourceRect.w / this.m_currentTexture.width);
        const ty2 = ty + (sourceRect.h / this.m_currentTexture.height);

        // -0.5, -0.5, 0, 0, 0,			// bottom left corner
        // v0
        d[i] = this.o_v0[0];
        d[i + 1] = this.o_v0[1];
        d[i + 2] = 0;
        // tc0
        d[i + 3] = tx;
        d[i + 4] = ty2;
        // color0
        d[i + 5] = tint_color.r;
        d[i + 6] = tint_color.g;
        d[i + 7] = tint_color.b;
        d[i + 8] = tint_color.a;

        // -0.5, 0.5, 0, 0, 1,			// top left corner
        // v1
        d[i + 9] = this.o_v1[0];
        d[i + 10] = this.o_v1[1];
        d[i + 11] = 0;
        // tc1
        d[i + 12] = tx;
        d[i + 13] = ty;
        // color1
        d[i + 14] = tint_color.r;
        d[i + 15] = tint_color.g;
        d[i + 16] = tint_color.b;
        d[i + 17] = tint_color.a;

        // 0.5, 0.5, 0, 1, 1,			// top right corner
        // v2
        d[i + 18] = this.o_v2[0];
        d[i + 19] = this.o_v2[1];
        d[i + 20] = 0;
        // tc2
        d[i + 21] = tx2;
        d[i + 22] = ty;
        // color2
        d[i + 23] = tint_color.r;
        d[i + 24] = tint_color.g;
        d[i + 25] = tint_color.b;
        d[i + 26] = tint_color.a;

        // 0.5, -0.5, 0, 1, 0			// bottom right corner
        // v3
        d[i + 27] = this.o_v3[0];
        d[i + 28] = this.o_v3[1];
        d[i + 29] = 0;
        // tc3
        d[i + 30] = tx2;
        d[i + 31] = ty2;
        // color3
        d[i + 32] = tint_color.r;
        d[i + 33] = tint_color.g;
        d[i + 34] = tint_color.b;
        d[i + 35] = tint_color.a;

        this.m_currentInstanceIndex++;
    }

    /**
     * {@inheritDoc SpriteRenderer}
     */
    public draw (texture: Texture2D, draw_rect: Rect, tint_color: Color, rotation_in_radians?: number, rotation_anchor?: Vec2): void
    {
        this.handleTexture(texture);

        const i = this.m_currentInstanceIndex * STRIDE;

        // instance count is too high, must draw.
        if (i > NUM_MAX_INSTANCES) 
        {
            this.glDraw();
        }

        // /******************* SETUP OPTIMIZATION VECTORS ******************/
        // it's easier to reason with vector.

        // TODO: use first with passed
        // const origin = origin ?? this.origin;
        const origin = this.origin;

        // move to top left by default
        const x = draw_rect.x - draw_rect.w * .5;
        const y = draw_rect.y - draw_rect.h * .5;

        const w = draw_rect.w;
        const h = draw_rect.h;

        // draw inner fills buffer correctly with positions, texture coordinates, tint color and increase the current instance index.
        this.drawInner(i, x, y, w, h, rotation_in_radians, rotation_anchor, tint_color);

    }

    /**
     * @inheritdoc
     */
    public drawSource (texture: Texture2D, drawRect: Rect, sourceRect: Rect, tintColor?: Color, rotationInRadians?: number, rotationAnchor?: Vec2): void
    {
        this.handleTexture(texture);

        const i = this.m_currentInstanceIndex * STRIDE;

        // instance count is too high, must draw.
        if (i > NUM_MAX_INSTANCES) 
        {
            this.glDraw();
        }

        // /******************* SETUP OPTIMIZATION VECTORS ******************/
        // it's easier to reason with vector.

        // TODO: use first with passed
        // const origin = origin ?? this.origin;
        const origin = this.origin;

        // move to top left by default
        const x = drawRect.x - drawRect.w * .5;
        const y = drawRect.y - drawRect.h * .5;

        const w = drawRect.w;
        const h = drawRect.h;

        // draw inner fills buffer correctly with positions, texture coordinates, tint color and increase the current instance index.
        this.drawInnerSource(
            i,
            x, y, w, h,
            sourceRect,
            rotationInRadians, rotationAnchor, tintColor);

    }

    /**
     * @inheritdoc
     */
    public drawOnPosition (texture: Texture2D, position: Vec2, tint_color?: Color, rotation_in_radians?: number, rotation_anchor?: Vec2, scale_factor?: Vec2): void
    {
        this.handleTexture(texture);

        const i = this.m_currentInstanceIndex * STRIDE;

        // instance count is too high, must draw.
        if (i > NUM_MAX_INSTANCES) 
        {
            this.glDraw();
        }

        // /******************* SETUP OPTIMIZATION VECTORS ******************/
        // it's easier to reason with vector.
        // TODO: use first with passed
        // const origin = origin ?? this.origin;
        const origin = this.origin;

        // move to top left by default
        const x = position[0] - origin.x * texture.width;
        const y = position[1] - origin.y * texture.height;

        let w = texture.width;
        let h = texture.height;

        if (scale_factor)
        {
            w *= scale_factor[0];
            h *= scale_factor[1];
        }

        // draw inner fills buffer correctly with positions, texture coordinates, tint color and increase the current instance index.
        this.drawInner(i, x, y, w, h, rotation_in_radians, rotation_anchor, tint_color);
    }

    /**
     * @brief End the sprite rendering.
     */
    public end (): void 
    {
        this.glDraw();
        this.m_gl.bindTexture(this.m_gl.TEXTURE_2D, null);
    }
}
