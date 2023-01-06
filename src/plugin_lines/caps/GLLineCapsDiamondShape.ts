import { GLLineJoin } from "../..";
import { Mat4x4, Color, Vec2 } from "../../framework/bones_math";
import { GLLineCaps, LineDrawAdditionalContext } from "../../framework/renderers/LineRenderer2D";
import { ShaderSource } from "../../webgl/renderers/common/ShaderSource";
import { GL_LINE_RENDERER_STRIDE } from "../../webgl/renderers/lines/GLLineRenderer2D";
import { GLShaderImplementation } from "../../webgl/shaders/GLShaderImplementation";


const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

layout (location = 0) in vec2 a_position;

uniform vec2 u_point;
uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform float u_width;

void main() 
{
    gl_Position = u_projectionMatrix * u_viewMatrix * vec4(u_width * a_position + u_point, 0.0, 1.0);
}`;

/**
 * Class that will create round line join for {@link GLLineRenderer2D}
 */
export class GLLineCapsDiamondShape implements GLLineCaps
{
    // gl 
    private m_gl: WebGL2RenderingContext
    private m_vao: WebGLVertexArrayObject;

    // shader
    private m_shader: GLShaderImplementation;
    private m_viewMatrixLocation: WebGLUniformLocation;
    private m_projectionMatrixLocation: WebGLUniformLocation;
    private m_widthLocation: WebGLUniformLocation;
    private m_colorLocation: WebGLUniformLocation;
    private m_pointLocation: WebGLUniformLocation;

    /**
     * If defined this color is used, if not, color from line is used.
     */
    public color?: Color;

    /**
     * Initialize the buffers.
     */
    private initializeBuffers (): void 
    {
        const gl = this.m_gl;

        const geometry = new Float32Array([
            0, -1,
            1, 0,
            0, 1,
            0, -1,
            -1, 0,
            0, 1
        ])

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // generate the geometry buffer.
        const geo_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, geo_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        // unbind
        gl.bindVertexArray(null);

        this.m_vao = vao;
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
        this.m_pointLocation = shader.getUniformLocation("u_point", true);

        this.m_shader = shader;
    }

    /**
     * @inheritdoc
     */
    public async initialize (gl: WebGL2RenderingContext): Promise<void> 
    {
        this.m_gl = gl;
        this.initializeBuffers();
        await this.initializeShaders();
    };

    /**
     * @inheritdoc
     */
    public draw (points: Array<Vec2>, projection_matrix: Mat4x4, view_matrix: Mat4x4, width: number, color: Color, ctx: LineDrawAdditionalContext): void 
    {
        // if stroked draw, but line is not a stroke, don't do anything
        if (ctx.hasStroke)
        {
            if (ctx.isStroke) return;

            // if stroke, use this for width.
            width = ctx.strokeLineWidth;
        }

        const gl = this.m_gl;

        gl.bindVertexArray(this.m_vao);

        this.m_shader.use();

        // uniforms
        gl.uniformMatrix4fv(this.m_projectionMatrixLocation, false, projection_matrix);
        gl.uniformMatrix4fv(this.m_viewMatrixLocation, false, view_matrix);
        gl.uniform1f(this.m_widthLocation, width);
        gl.uniform4fv(this.m_colorLocation, this.color ? this.color : color);


        // draw
        gl.uniform2fv(this.m_pointLocation, points[0]);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // draw end 
        gl.uniform2fv(this.m_pointLocation, points[points.length - 1]);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}