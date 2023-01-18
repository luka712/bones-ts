import { Color, Vec2 } from "../../../framework/bones_math";
import { Framework } from "../../../framework/Framework";
import { Camera2D } from "../../../framework/renderers/common/Camera2D";
import { RectangleRenderer } from "../../../framework/renderers/RectangleRenderer";
import { Blend } from "../../../framework/SpriteRenderer";
import { GLShaderImplementation } from "../../shaders/GLShaderImplementation";
import { GLBlendModeUtil } from "../common/GLBlendModeUtil";
import { ShaderSource } from "../common/ShaderSource";
import { GLRectangleRoundedCorner } from "./corner/GLRectangleRoundedCorner";

// HOW IT WORKS
// it renders a quad
// quad triangles are renderer same for each instance
// the rest of data, such as point a positon, point b position, weight and color is set per instance

const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

layout (location = 0) in vec2 a_position;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;

void main()
{
    gl_Position = u_projectionMatrix * u_viewMatrix * vec4(a_position, 0.0, 1.0);
}
`;

// Rect will be created from 5 rectangles + 4 triangle fans for radius of each corner.
// Smaller rectangles are boundaries made from rounded edges + inner rect

const RESOLUTION = 10;
// step for each triangle.
const STEP = (Math.PI * .5) / (RESOLUTION - 2);

// points vec2 a, vec2 b
export const GL_LINE_RENDERER_STRIDE = 4 * Float32Array.BYTES_PER_ELEMENT;

export class GLRectangleRenderer extends RectangleRenderer
{
    // private 
    private m_gl: WebGL2RenderingContext;

    /**
     * The corners.
     */
    private m_corners: GLRectangleRoundedCorner;

    // buffers and data for rects
    private m_vaoRects: WebGLVertexArrayObject;
    private m_rectsBuffer: WebGLBuffer;
    private m_rectsData: Float32Array; // Left, Top, Right, Bottom, Center

    // shader stuff
    private m_shader: GLShaderImplementation;
    private m_viewMatrixLocation: WebGLUniformLocation;
    private m_projectionMatrixLocation: WebGLUniformLocation;
    private m_colorLocation: WebGLUniformLocation;

    // default
    private o_color = Color.white();
    private o_strokeColor = Color.black();



    constructor(framework: Framework)
    {
        super();

        this.m_gl = Framework.gl;
        this.m_corners = new GLRectangleRoundedCorner();
    }


    /**
     * Initialize the geometry buffers.
     */
    private initializeBuffers (): void 
    {
        const indices = [];
        // for 5 rects.
        // index
        let i_index = 0;
        for (let i = 0; i < 30; i += 6)
        {
            indices[i] = i_index;
            indices[i + 1] = i_index + 1;
            indices[i + 2] = i_index + 2;

            // second triangle
            indices[i + 3] = i_index;
            indices[i + 4] = i_index + 2;
            indices[i + 5] = i_index + 3;

            i_index += 4;
        }

        const gl = this.m_gl;

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // indices buffer.
        const i_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, i_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

        // Position buffer.
        // 4 for each corner, 2 for position 2
        this.m_rectsData = new Float32Array(4 * 2 * 5);

        // RECTANGLES
        const rects_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, rects_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.m_rectsData, gl.STREAM_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        // unbind
        gl.bindVertexArray(null);

        this.m_vaoRects = vao;
        this.m_rectsBuffer = rects_buffer;
    }

    /**
     * Initialize the shaders.
     */
    private async initializeShaders (): Promise<void>
    {
        const shader = new GLShaderImplementation(this.m_gl, VERTEX_SHADER_SOURCE, ShaderSource.COMMON_COLOR_FRAGMENT_SHADER);

        await shader.initialize();

        this.m_viewMatrixLocation = shader.getUniformLocation("u_viewMatrix", true);
        this.m_projectionMatrixLocation = shader.getUniformLocation("u_projectionMatrix", true);
        this.m_colorLocation = shader.getUniformLocation("u_color", true);

        this.m_shader = shader;
    }

    public async initialize (): Promise<void> 
    {
        this.initializeBuffers();
        await this.initializeShaders();
        this.m_corners.initialize();
    }

    /**
    * Call gl to draw. 
    */
    private glDraw (color: Color): void 
    {
        const gl = this.m_gl;

        // use and set shader vars
        this.m_shader.use();
        gl.uniformMatrix4fv(this.m_projectionMatrixLocation, false, Camera2D.projectionMatrix);
        gl.uniformMatrix4fv(this.m_viewMatrixLocation, false, Camera2D.viewMatrix);
        gl.uniform4fv(this.m_colorLocation, color);


        // RECTANGLES 

        gl.bindVertexArray(this.m_vaoRects);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.m_rectsBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.m_rectsData);

        // draw. 5 * 6 ( 5 rects, 6 vertices)
        gl.drawElements(gl.TRIANGLES, 30, gl.UNSIGNED_BYTE, 0);


    }

    /**
     * {@inheritDoc SpriteRenderer}
     */
    public begin (mode?: Blend): void
    {
        if (mode)
        {
            GLBlendModeUtil.setBlendMode(this.m_gl, mode);
        }
    }


    /**
     * Draws the left sub-rect of a rectangle
     */
    private drawLeftRect (x: number, y: number, h: number, tlr: number, blr: number)
    {
        const d = this.m_rectsData;

        // must draw a longer radius for x positions. since rect is drawn from top left clock wise
        const x_rad = Math.max(tlr, blr);

        // a top left
        d[0] = x;       // x
        d[1] = y + tlr; // y + r

        // b top right
        d[2] = x + x_rad; // x + r
        d[3] = d[1];    // y + r

        // c bottom right
        d[4] = d[2];       // x
        d[5] = y + h - blr; // y + h - r

        // d bottom left
        d[6] = x;     // x
        d[7] = d[5];  // y + h - r
    }

    /**
     * Draws the top sub-rect of a rectangle
     */
    private drawTopRect (x: number, y: number, w: number, tlr: number, trr: number)
    {
        const d = this.m_rectsData;

        // must draw a longer radius for x positions. since rect is drawn from top left clock wise
        const y_rad = Math.max(tlr, trr);

        // a top left
        d[8] = x + tlr; // x + r
        d[9] = y; // y

        // b top right
        d[10] = x + w - trr; // x + w - r
        d[11] = y;           // y 

        // c bottom right
        d[12] = d[10];     // x + w - r 
        d[13] = y + y_rad; // y + r

        // d bottom left
        d[14] = d[8];     // x + r
        d[15] = d[13];  // y + r
    }

    /**
     * Draws the right sub-rect of a rectangle
     */
    private drawRightRect (x: number, y: number, w: number, h: number, trr: number, brr: number)
    {
        const d = this.m_rectsData;

        // must draw a longer radius for x positions. since rect is drawn from top left clock wise
        const x_rad = Math.max(brr, trr);

        // a top left
        d[16] = x + w - x_rad; // x + w - r
        d[17] = y + trr; // y + r

        // b top right
        d[18] = x + w; // x + w 
        d[19] = d[17];    // y + r

        // c bottom right
        d[20] = d[18];     // x + w  
        d[21] = y + h - brr; // y + h - r

        // d bottom left
        d[22] = d[16];     // x + w - r
        d[23] = d[21];  // y + h - r
    }

    /**
     * Draws the bottom sub-rect of a rectangle
     */
    private drawBottomRect (x: number, y: number, w: number, h: number, brr: number, blr: number)
    {
        const d = this.m_rectsData;

        // must draw a longer radius for x positions. since rect is drawn from top left clock wise
        const y_rad = Math.max(brr, blr);

        // a top left
        d[24] = x + blr; // x + r
        d[25] = y + h - y_rad; // y + h - r

        // b top right
        d[26] = x + w - brr;    // x + w - r 
        d[27] = d[25];    // y + h - r

        // c bottom right
        d[28] = d[26];     // x + w - r  
        d[29] = y + h; // y + h

        // d bottom left
        d[30] = d[24];     // x + r
        d[31] = d[29];  // y + h
    }

    /**
     * Draws the inner rect of a rectangle.
     */
    private drawInnerRect (x: number, y: number, w: number, h: number, tl: number, tr: number, br: number, bl: number)
    {
        const d = this.m_rectsData;

        // top left 
        d[32] = x + tl;
        d[33] = y + tl;

        // top right
        d[34] = x + w - tr;
        d[35] = y + tr;

        // bottom right
        d[36] = x + w - br;
        d[37] = y + h - br;

        // already defined by c point of left rect
        d[38] = x + bl;
        d[39] = y + h - bl;
    }

    private drawInner (
        x: number, y: number, w: number, h: number,
        color: Color,
        tl: number, tr: number, br: number, bl: number): void 
    {

        // rects
        this.drawLeftRect(x, y, h, tl, bl);
        this.drawTopRect(x, y, w, tl, tr);
        this.drawRightRect(x, y, w, h, tr, br);
        this.drawBottomRect(x, y, w, h, br, bl);
        this.drawInnerRect(x, y, w, h, tl, tr, br, bl);
        this.glDraw(color);

        this.m_corners.draw(x, y, w, h, tl, tr, br, bl, color);

    }

    /**
     * @inheritdoc
     */
    public draw (
        x: number, y: number, w: number, h: number,
        color?: Color,
        tl: number = 0, tr: number = 0, br: number = 0, bl: number = 0): void 
    {
        this.drawInner(
            x, y, w, h,
            color ?? this.o_color,
            tl, tr, br, bl);
    }

    /**
     * @inheritdoc
     */
    public drawWithStroke (x: number, y: number, w: number, h: number,
        color?: Color, stroke_width: number = 2, stroke_color?: Color,
        tl: number = 0, tr: number = 0, br: number = 0, bl: number = 0)
    {

        this.drawInner(
            x, y, w, h,
            stroke_color ?? this.o_strokeColor,
            tl, tr, br, bl);

        this.drawInner(
            x + stroke_width, y + stroke_width, w - stroke_width  * 2, h - stroke_width * 2,
            color ?? this.o_color,
            tl, tr, br, bl);

    }

    /**
     * @inheritdoc
     */
    public end (): void
    {
    }
} 