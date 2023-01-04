import { Color, Mat4x4 } from "../../../../framework/bones_math";
import { GLShaderImplementation } from "../../../shaders/GLShaderImplementation";
import { ShaderSource } from "../../common/ShaderSource";
import { GL_LINE_RENDERER_STRIDE } from "../GLLineRenderer2D";
import { GLLineJoin } from "./GLLineJoin";

const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

layout (location = 0) in vec2 a_position;
layout (location = 1) in vec2 a_point;

uniform mat4 u_projection_matrix;
uniform mat4 u_view_matrix;
uniform float u_width;

void main() 
{
    gl_Position = u_projection_matrix * u_view_matrix * vec4(u_width * a_position + a_point, 0.0, 1.0);
}`;

/**
 * Class that will create round line join for {@link GLLineRenderer2D}
 */
export class GLLineJoinRound implements GLLineJoin
{
    // gl 
    private m_gl: WebGL2RenderingContext
    private m_vao: WebGLVertexArrayObject;
    private m_count: number;

    // shader
    private m_shader: GLShaderImplementation;
    private m_viewMatrixLocation: WebGLUniformLocation;
    private m_projectionMatrixLocation: WebGLUniformLocation;
    private m_widthLocation: WebGLUniformLocation;
    private m_colorLocation: WebGLUniformLocation;

    /**
     * Initialize the buffers.
     * @param points_buffer - the buffer, initialized by {@link GLLineRenderer2D} which holds points data.
     */
    private initializeBuffers (points_buffer: WebGLBuffer): void 
    {
        const gl = this.m_gl;

        // resolution is amount of detail on triangle fun that makes a circle.
        const resolution = 16;

        // generate round geometry
        const positions = [0, 0]; // center point
        for (let wedge = 0; wedge <= resolution; wedge++)
        {
            // fan around center point
            const theta = (2 * Math.PI * wedge) / resolution;
            positions.push(0.5 * Math.cos(theta));
            positions.push(0.5 * Math.sin(theta));
        }

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // generate the geometry buffer.
        const geo_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, geo_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        // no division, each instance has same position.
        gl.vertexAttribDivisor(0, 0);

        // just bind the points buffer. We only care about point from that buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, points_buffer);

        // point 
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, GL_LINE_RENDERER_STRIDE, 2 * Float32Array.BYTES_PER_ELEMENT);
        gl.vertexAttribDivisor(1, 1);

        // unbind
        gl.bindVertexArray(null);

        this.m_vao = vao;
        this.m_count = positions.length / 2;
    }

    /**
     * Initializes the shaders.
     */
    private async initializeShaders (): Promise<void>
    {
        const shader = new GLShaderImplementation(this.m_gl, VERTEX_SHADER_SOURCE, ShaderSource.UNIFORM_COLOR_FRAGMENT_SOURCE);
        await shader.initialize();

        this.m_viewMatrixLocation = shader.getUniformLocation("u_view_matrix", true);
        this.m_projectionMatrixLocation = shader.getUniformLocation("u_projection_matrix", true);
        this.m_widthLocation = shader.getUniformLocation("u_width", true);
        this.m_colorLocation = shader.getUniformLocation("u_color", true);

        this.m_shader = shader;
    }

    /**
     * @inheritdoc
     */
    public async initialize (gl: WebGL2RenderingContext, points_buffer: WebGLBuffer): Promise<void> 
    {
        this.m_gl = gl;
        this.initializeBuffers(points_buffer);
        await this.initializeShaders();
    };

    /**
     * @inheritdoc
     */
    public draw (instance_index: number, projection_matrix: Mat4x4, view_matrix: Mat4x4, width: number, color: Color): void 
    {
        const gl = this.m_gl;

        gl.bindVertexArray(this.m_vao);

        this.m_shader.use();

        // camera
        gl.uniformMatrix4fv(this.m_projectionMatrixLocation, false, projection_matrix);
        gl.uniformMatrix4fv(this.m_viewMatrixLocation, false, view_matrix);
        gl.uniform1f(this.m_widthLocation, width);
        gl.uniform4fv(this.m_colorLocation, color);

        // draw
        gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, this.m_count, instance_index - 1);
    }
}