

// HOW IT WORKS
// it renders a quad
// quad triangles are renderer same for each instance
// the rest of data, such as point a positon, point b position, weight and color is set per instance

import { Vec2, Color } from "../../../../bones_math";
import { FrameworkContext } from "../../../../FrameworkContext";
import { Camera2D } from "../../../common/Camera2D";
import { GLShaderImplementation } from "../../../../../webgl/shaders/GLShaderImplementation";
import verexShaderSource from "./rectangle_renderer_v.glsl?raw"
import fragmentShaderSource from "../../../../shader_source/gl/basic_color_f.glsl?raw"



// Rect will be created from 5 rectangles + 4 triangle fans for radius of each corner.
// Smaller rectangles are boundaries made from rounded edges + inner rect

const RESOLUTION = 10;
// step for each triangle.
const STEP = (Math.PI * .5) / (RESOLUTION - 2);

// points vec2 a, vec2 b
export const GL_LINE_RENDERER_STRIDE = 4 * Float32Array.BYTES_PER_ELEMENT;

export class GLRectangleRoundedCorner
{
    // private 
    private m_gl: WebGL2RenderingContext;

    // buffers and data for radius edges
    private m_vao: WebGLVertexArrayObject;
    private m_instanceBuffer: WebGLBuffer;
    private m_instanceData: Float32Array;

    // shader stuff
    private m_shader: GLShaderImplementation;
    private _projectionViewMatrixLocation: WebGLUniformLocation;
    private m_colorLocation: WebGLUniformLocation;

    // default
    private o_vec2 = Vec2.zero();

    constructor()
    {
        this.m_gl = FrameworkContext.gl;
    }

    /**
     * Initialize the geometry buffers.
     */
    private initializeBuffers (): void 
    {
        const gl = this.m_gl;

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const d = [0, 0];

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


        // Position buffer
        // TODO: keep it to clear it.
        const attribPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, attribPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(d), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(0, 0);

        const stride = Float32Array.BYTES_PER_ELEMENT * (2 + 1 + 1);

        this.m_instanceData = new Float32Array(4 * 4);
        const instance_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, instance_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.m_instanceData, gl.STREAM_DRAW);

        // point 
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 0);
        gl.vertexAttribDivisor(1, 1);

        // radius
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, Float32Array.BYTES_PER_ELEMENT * 2);
        gl.vertexAttribDivisor(2, 1);

        // offset 
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, Float32Array.BYTES_PER_ELEMENT * (2 + 1));
        gl.vertexAttribDivisor(3, 1);

        // unbind
        gl.bindVertexArray(null);

        this.m_vao = vao;
        this.m_instanceBuffer = instance_buffer;
    }

    /**
     * Initialize the shaders.
     */
    private async initializeShaders (): Promise<void>
    {
        const shader = new GLShaderImplementation(this.m_gl, verexShaderSource, fragmentShaderSource);

        await shader.initialize();

        this._projectionViewMatrixLocation = shader.getUniformLocation("u_projectionView", true);
        this.m_colorLocation = shader.getUniformLocation("u_color", true);

        this.m_shader = shader;
    }

    /**
     * @inheritdoc
     */
    public async initialize (): Promise<void> 
    {
        this.initializeBuffers();
        await this.initializeShaders();
    }

    public draw (
        x: number, y: number, w: number, h: number,
        tl: number, tr: number, br: number, bl: number,
        color: Color): void 
    {

        // rects
        // TOP LEFT
        this.m_instanceData[0] = x + tl;
        this.m_instanceData[1] = y + tl;
        this.m_instanceData[2] = tl;
        this.m_instanceData[3] = Math.PI;

        // TOP RIGHT 
        this.m_instanceData[4] = x + w - tr;
        this.m_instanceData[5] = y + tr;
        this.m_instanceData[6] = tr;
        this.m_instanceData[7] = Math.PI * 1.5;

        // BOTTOM RIGHT 
        this.m_instanceData[8] = x + w - br;
        this.m_instanceData[9] = y + h - br;
        this.m_instanceData[10] = br;
        this.m_instanceData[11] = 0;

        // BOTTOM LEFT 
        this.m_instanceData[12] = x + bl;
        this.m_instanceData[13] = y + h - bl;
        this.m_instanceData[14] = bl;
        this.m_instanceData[15] = Math.PI * .5;

      
        const gl = this.m_gl;

        // use and set shader vars
        this.m_shader.use();
        gl.uniformMatrix4fv(this._projectionViewMatrixLocation, false, Camera2D.projectionViewMatrix);
        gl.uniform4fv(this.m_colorLocation, color );


        // vao and buffer data
        gl.bindVertexArray(this.m_vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.m_instanceBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.m_instanceData);

        // draw fans instances. 
        gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, RESOLUTION, 4);
    }
} 