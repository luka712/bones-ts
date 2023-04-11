import { GLShaderImplementation } from "../../../../webgl/shaders/GLShaderImplementation";
import { Framework } from "../../../Framework";
import { FrameworkContext } from "../../../FrameworkContext";
import { Color } from "../../../bones_math";
import { RectangleRenderer } from "../../RectangleRenderer";
import { Camera2D } from "../../common/Camera2D";
import { GLRectangleRoundedCorner } from "./corner/GLRectangleRoundedCorner";
import vertexShaderSource from "./rectangle_v.glsl?raw"
import fragmentShaderSource from "../../../shader_source/gl/basic_color_f.glsl?raw"
import { RectangleInstanceData } from "../common/RectangleInstanceData";

// HOW IT WORKS
// it renders a quad
// quad triangles are renderer same for each instance
// the rest of data, such as point a positon, point b position, weight and color is set per instance

// Rect will be created from 5 rectangles + 4 triangle fans for radius of each corner.
// Smaller rectangles are boundaries made from rounded edges + inner rect

const RESOLUTION = 10;
// step for each triangle.
const STEP = (Math.PI * .5) / (RESOLUTION - 2);

// points vec2 a, vec2 b
export const GL_LINE_RENDERER_STRIDE = 4 * Float32Array.BYTES_PER_ELEMENT;

export class GLRectangleRenderer extends RectangleRenderer
{
    // #region Properties (11)

    private m_colorLocation: WebGLUniformLocation;
    /**
     * The corners.
     */
    private m_corners: GLRectangleRoundedCorner;
    // private
    private m_gl: WebGL2RenderingContext;
    // geometry for rect.
    private m_instanceBuffer: WebGLBuffer;
    private m_instanceData = new RectangleInstanceData();
    private m_projectionViewLocation: WebGLUniformLocation;
    // logic for data per instance, position and size for 5 rects

    // shader stuff
    private m_shader: GLShaderImplementation;
    // buffers and data for rects
    private m_vao: WebGLVertexArrayObject;
    private m_vertexBuffer: WebGLBuffer;
    // default
    private o_color = Color.white();
    private o_strokeColor = Color.black();

    // #endregion Properties (11)

    // #region Constructors (1)

    constructor(framework: Framework)
    {
        super();

        this.m_gl = FrameworkContext.gl;
        this.m_corners = new GLRectangleRoundedCorner();
    }

    // #endregion Constructors (1)

    // #region Public Methods (3)

    /**
     * @inheritdoc
     */
    public draw (
        x: number, y: number, w: number, h: number,
        color?: Color,
        tl: number = 0, tr: number = 0, br: number = 0, bl: number = 0): void 
    {
        color = color ?? this.o_color;

        // rects
        this.m_instanceData.fillInstance(x, y, w, h, tl, tr, br, bl);
        this.glDraw(color);
        this.m_corners.draw(x, y, w, h, tl, tr, br, bl, color);
    }

    /**
     * @inheritdoc
     */
    public drawWithStroke (x: number, y: number, w: number, h: number,
        color?: Color, stroke_width: number = 2, stroke_color?: Color,
        tl: number = 0, tr: number = 0, br: number = 0, bl: number = 0)
    {
        this.draw(
            x, y, w, h,
            stroke_color ?? this.o_strokeColor,
            tl, tr, br, bl);

        this.draw(
            x + stroke_width, y + stroke_width, w - stroke_width * 2, h - stroke_width * 2,
            color ?? this.o_color,
            tl, tr, br, bl);
    }

    public async initialize (): Promise<void> 
    {
        this.initializeBuffers();
        await this.initializeShaders();
        this.m_corners.initialize();
    }

    // #endregion Public Methods (3)

    // #region Private Methods (3)

    /**
    * Call gl to draw. 
    */
    private glDraw (color: Color): void 
    {
        const gl = this.m_gl;

        // use and set shader vars
        this.m_shader.use();
        gl.uniformMatrix4fv(this.m_projectionViewLocation, false, Camera2D.projectionViewMatrix);
        gl.uniform4fv(this.m_colorLocation, color);

        gl.bindVertexArray(this.m_vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.m_instanceBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.m_instanceData.data);

        // draw. 5 * 6 ( 5 rects, 6 vertices)
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 5);
    }

    /**
     * Initialize the geometry buffers.
     */
    private initializeBuffers (): void 
    {
        const vertices = [
            0, 1, // v1
            1, 1, // v2
            1, 0, // v3
            0, 1, // v1
            1, 0, // v3
            0, 0  // v4
        ];

        const gl = this.m_gl;

        this.m_vao = gl.createVertexArray();
        gl.bindVertexArray(this.m_vao);

        // vertex
        this.m_vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.m_vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        this.m_instanceBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.m_instanceBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.m_instanceData.data, gl.STREAM_DRAW);

        // position
        const stride = Float32Array.BYTES_PER_ELEMENT * 4;
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 0);
        gl.vertexAttribDivisor(1, 1);

        // size
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, Float32Array.BYTES_PER_ELEMENT * 2);
        gl.vertexAttribDivisor(2, 1);

        // unbind
        gl.bindVertexArray(null);
    }

    /**
     * Initialize the shaders.
     */
    private async initializeShaders (): Promise<void>
    {
        const shader = new GLShaderImplementation(this.m_gl, vertexShaderSource, fragmentShaderSource);

        await shader.initialize();

        this.m_projectionViewLocation = shader.getUniformLocation("u_projectionView", true);
        this.m_colorLocation = shader.getUniformLocation("u_color", true);

        this.m_shader = shader;
    }

    // #endregion Private Methods (3)
} 