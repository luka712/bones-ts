
// HOW IT WORKS
// it renders a quad
// quad triangles are renderer same for each instance
// the rest of data, such as point a positon, point b position, weight and color is set per instance

import { Color, Vec2 } from "../../../framework/bones_math";
import { Framework } from "../../../framework/Framework";
import { Camera2D } from "../../../framework/renderers/common/Camera2D";
import { Blend } from "../../../framework/SpriteRenderer";
import { WindowManager } from "../../../framework/Window";
import { GLShaderImplementation } from "../../shaders/GLShaderImplementation";
import { GLBlendModeUtil } from "../common/GLBlendModeUtil";

const RESOLUTION = 25;
// step for each triangle.
const STEP = (Math.PI * 2) / (RESOLUTION - 2);

const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

layout (location = 0) in vec2 a_position;
layout (location = 1) in vec2 a_point; // point is position on screen
layout (location = 2) in vec2 a_size; // width and height.
layout (location = 3) in vec4 a_color; // the color.

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;

out vec2 v_position;
out vec2 v_size;
out vec4 v_color;

void main()
{
    gl_PointSize = 10.0;
    v_color = a_color;

    vec2 pos = a_position * a_size;
    gl_Position = u_projectionMatrix * u_viewMatrix * vec4(pos + a_point, 0.0, 1.0);
    
    //  vec2 ndc_pos = gl_Position.xy / gl_Position.w;
    // v_position = u_resolution * (ndc_pos * 0.5 + 0.5);
}
`;

const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;


in vec4 v_color;

          
layout (location = 0)out vec4 o_color;
layout (location = 1)out vec4 o_brightColor;

void main()
{
    o_color = v_color;
    float amount = (o_color.r + o_color.g + o_color.b) / 3.0;
    if(amount > 0.7)
    {
        o_brightColor = o_color;
    }
    else
    {
        o_brightColor = vec4(0.0, 0.0,0.0,1.0);
    }
}
`;

const MAX_INSTANCES = 10000;

// point + size + color
const STRIDE = (2 + 2 + 4) * Float32Array.BYTES_PER_ELEMENT;

export class GLEllipseRenderer
{
    // private 
    private m_gl: WebGL2RenderingContext;
    private m_window: WindowManager;


    // buffers and data for rects
    private m_vaoRects: WebGLVertexArrayObject;
    private m_buffer: WebGLBuffer;
    private m_data: Float32Array;

    // shader stuff
    private m_shader: GLShaderImplementation;
    private m_viewMatrixLocation: WebGLUniformLocation;
    private m_projectionMatrixLocation: WebGLUniformLocation;

    // default
    private o_color = Color.white();
    private o_strokeColor = Color.black();
    private o_vec2 = Vec2.zero();

    // instances
    private m_instanceCount: number = 0;

    constructor(framework: Framework)
    {
        //super();

        this.m_gl = Framework.gl;
        this.m_window = framework.window;
    }


    /**
     * Initialize the geometry buffers.
     */
    private initializeBuffers (): void 
    {

        const gl = this.m_gl;

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);



        const d = [0,0];
        // must be counter clockwise 
        let a = 0;
        for (let i = 0; i < RESOLUTION - 1; i++)
        {
            Vec2.fromPolar(a, 1, this.o_vec2);
            // must be counter clockwise 
            a += STEP;
            d.push(this.o_vec2[0]);
            d.push(this.o_vec2[1]);
        }

        // draw triangle fans for ellipse

        // non changing buffers with circle vertices.
        const vertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(d), gl.STATIC_DRAW);

        // vertices
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        // const mutable data
        this.m_data = new Float32Array(MAX_INSTANCES * STRIDE);

        const mutable_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, mutable_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.m_data, gl.STREAM_DRAW);

        // point
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1,2, gl.FLOAT, false, STRIDE, 0);
        gl.vertexAttribDivisor(1,1);

        // size
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, STRIDE, 2 * Float32Array.BYTES_PER_ELEMENT);
        gl.vertexAttribDivisor(2,1);

        // color
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 4, gl.FLOAT, false, STRIDE, 4 * Float32Array.BYTES_PER_ELEMENT);
        gl.vertexAttribDivisor(3,1);

        // unbind
        gl.bindVertexArray(null);

        this.m_vaoRects = vao;
        this.m_buffer = mutable_buffer;
    }

    /**
     * Initialize the shaders.
     */
    private async initializeShaders (): Promise<void>
    {
        const shader = new GLShaderImplementation(this.m_gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);

        await shader.initialize();

        this.m_viewMatrixLocation = shader.getUniformLocation("u_viewMatrix", true);
        this.m_projectionMatrixLocation = shader.getUniformLocation("u_projectionMatrix", true);

        this.m_shader = shader;
    }

    public async initialize (): Promise<void> 
    {
        this.initializeBuffers();
        await this.initializeShaders();
    }

    /**
    * Call gl to draw. 
    */
    private glDraw (): void 
    {
        const gl = this.m_gl;

        gl.bindVertexArray(this.m_vaoRects);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.m_buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.m_data, 0, this.m_instanceCount * STRIDE);

        gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, RESOLUTION, this.m_instanceCount);
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

        const gl = this.m_gl;

        this.m_instanceCount = 0;

        // use and set shader vars
        this.m_shader.use();
        gl.uniformMatrix4fv(this.m_projectionMatrixLocation, false, Camera2D.projectionMatrix);
        gl.uniformMatrix4fv(this.m_viewMatrixLocation, false, Camera2D.viewMatrix);
    }

    /**
     * @inheritdoc
     */
    public draw (
        x: number, y: number, w: number, h: number,
        color?: Color)  
    {
        let k = this.m_instanceCount;

        k *= 8;

        const d = this.m_data;

        color = color ?? this.o_color;

        // point
        d[k] = x;
        d[k + 1] = y;

        // size
        d[k + 2] = w / 2;
        d[k + 3] = h / 2;

        // color 
        d[k + 4] = color[0];
        d[k + 5] = color[1];
        d[k + 6] = color[2];
        d[k + 7] = color[3];

        this.m_instanceCount++;

        if(this.m_instanceCount >= MAX_INSTANCES)
        {
            this.glDraw();
        }
    }

    /**
     * @inheritdoc
     */
    public drawWithStroke (x: number, y: number, w: number, h: number,
        color?: Color, stroke_width: number = 2, stroke_color?: Color)
    {

        this.draw(
            x, y, w, h,
            stroke_color ?? this.o_strokeColor);

        this.draw(
            x, y, w - stroke_width, h - stroke_width,
            color ?? this.o_color);

    }

    /**
     * @inheritdoc
     */
    public end (): void
    {
        this.glDraw();
    }
} 