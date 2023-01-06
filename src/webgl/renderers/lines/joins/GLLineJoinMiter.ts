import { Color, Mat4x4 } from "../../../../framework/bones_math";
import { GLShaderImplementation } from "../../../shaders/GLShaderImplementation";
import { ShaderSource } from "../../common/ShaderSource";
import { GL_LINE_RENDERER_STRIDE } from "../GLLineRenderer2D";
import { GLLineJoin, LineDrawAdditionalContext } from "../../../../framework/renderers/LineRenderer2D";


// see https://wwwtyro.net/2019/11/18/instanced-lines.html
const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

layout (location = 0) in vec3 a_position;
layout (location = 1) in vec2 a_pointA;
layout (location = 2) in vec2 a_pointB;
layout (location = 3) in vec2 a_pointC;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform float u_width;

void main() 
{
    float width = u_width;

    // gl_PointSize = 10.0;

    vec2 tangent = normalize(normalize(a_pointC - a_pointB) + normalize(a_pointB - a_pointA));
    vec2 miter = vec2(-tangent.y, tangent.x);

    vec2 ab = a_pointB - a_pointA;
    vec2 cb = a_pointB - a_pointC;
    vec2 ab_norm = normalize(vec2(-ab.y, ab.x));
    vec2 cb_norm = -normalize(vec2(-cb.y, cb.x));

    float sigma = sign(dot(ab + cb, miter));

    vec2 p0 = 0.5 * width * sigma * (sigma < 0.0 ? ab_norm : cb_norm);
    vec2 p1 = 0.5 * miter * sigma * width / dot(miter, ab_norm);
    vec2 p2 = 0.5 * width * sigma * (sigma < 0.0 ? cb_norm : ab_norm);

    vec2 point = a_pointB + a_position.x * p0 + a_position.y * p1 + a_position.z * p2;

    gl_Position = u_projectionMatrix* u_viewMatrix* vec4(point, 0.0, 1.0);
}`;

/**
 * Class that will create miter line join for {@link GLLineRenderer2D}
 */
export class GLLineJoinMiter implements GLLineJoin
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

        // set of coefficients for miter basis vectors
        const ceoff_data = [
            0, 0, 0,
            1, 0, 0,
            0, 1, 0,
            0, 0, 0,
            0, 1, 0,
            0, 0, 1
        ];

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // generate the geometry buffer.
        const geo_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, geo_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ceoff_data), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        // no division, each instance has same position.
        gl.vertexAttribDivisor(0, 0);

        // just bind the points buffer. We only care about point from that buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, points_buffer);

        // point a
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, GL_LINE_RENDERER_STRIDE, 0);
        gl.vertexAttribDivisor(1, 1);

        // point b
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, GL_LINE_RENDERER_STRIDE, 2 * Float32Array.BYTES_PER_ELEMENT);
        gl.vertexAttribDivisor(2, 1);

        // point c
        gl.enableVertexAttribArray(3);
        // note that offset is 6, because middle point is duplicated.
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, GL_LINE_RENDERER_STRIDE, 6 * Float32Array.BYTES_PER_ELEMENT);
        gl.vertexAttribDivisor(3, 1);

        // unbind
        gl.bindVertexArray(null);

        this.m_vao = vao;
        this.m_count = 6; // number of vertices
    }

    /**
     * Initializes the shaders.
     */
    private async initializeShaders (): Promise<void>
    {
        const shader = new GLShaderImplementation(this.m_gl, VERTEX_SHADER_SOURCE, ShaderSource.COMMON_COLOR_FRAGMENT_SHADER);
        await shader.initialize();

        this.m_viewMatrixLocation = shader.getUniformLocation("u_viewMatrix", true);
        this.m_projectionMatrixLocation = shader.getUniformLocation("u_projectionMatrix", true);
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
    public draw (instance_index: number, projection_matrix: Mat4x4, view_matrix: Mat4x4, width: number, color: Color, ctx: LineDrawAdditionalContext): void 
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
        gl.drawArraysInstanced(gl.TRIANGLES, 0, this.m_count, instance_index -1);

    }
}