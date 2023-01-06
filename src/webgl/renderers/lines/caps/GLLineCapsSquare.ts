import { Color, Mat4x4, Vec2 } from "../../../../framework/bones_math";
import { GLLineCaps, LineDrawAdditionalContext } from "../../../../framework/renderers/LineRenderer2D";
import { GLShaderImplementation } from "../../../shaders/GLShaderImplementation";
import { ShaderSource } from "../../common/ShaderSource";

const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

layout (location = 0) in vec2 a_position;

uniform vec2 u_pointA;
uniform vec2 u_pointB;
uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform float u_width;

void main() 
{
    vec2 x_basis = normalize(u_pointB - u_pointA);
    vec2 y_basis = vec2(-x_basis.y, x_basis.x);
    vec2 point = u_pointB + x_basis * 0.5 * u_width * a_position.x + y_basis * u_width * a_position.y;
    gl_Position = u_projectionMatrix* u_viewMatrix* vec4(point, 0, 1);
}`;

/**
 * Class that will create round line join for {@link GLLineRenderer2D}
 */
export class GLLineCapsSquare implements GLLineCaps
{
    // gl 
    private m_gl: WebGL2RenderingContext
    private m_vao: WebGLVertexArrayObject;

    // shader
    private m_shader: GLShaderImplementation;
    private m_pointALocation: WebGLUniformLocation;
    private m_pointBLocation: WebGLUniformLocation;
    private m_viewMatrixLocation: WebGLUniformLocation;
    private m_projectionMatrixLocation: WebGLUniformLocation;
    private m_widthLocation: WebGLUniformLocation;
    private m_colorLocation: WebGLUniformLocation;

    /**
     * Initialize the buffers.
     * @param points_buffer - the buffer, initialized by {@link GLLineRenderer2D} which holds points data.
     */
    private initializeBuffers (): void 
    {
        const gl = this.m_gl;

        const position_data = new Float32Array([
            0, -0.5,
            1, -0.5,
            1, 0.5,
            0, -0.5,
            1, 0.5,
            0, 0.5
        ])

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // generate the geometry buffer.
        const geo_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, geo_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, position_data, gl.STATIC_DRAW);
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

        this.m_pointALocation = shader.getUniformLocation("u_pointA", true);
        this.m_pointBLocation = shader.getUniformLocation("u_pointB", true);
        this.m_viewMatrixLocation = shader.getUniformLocation("u_viewMatrix", true);
        this.m_projectionMatrixLocation = shader.getUniformLocation("u_projectionMatrix", true);
        this.m_widthLocation = shader.getUniformLocation("u_width", true);
        this.m_colorLocation = shader.getUniformLocation("u_color", true);

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
        const gl = this.m_gl;

        const a1 = points[0];
        const b1 = points[1];

        const a2 = points[points.length - 2];
        const b2 = points[points.length - 1];

        gl.bindVertexArray(this.m_vao);

        this.m_shader.use();

        // camera
        gl.uniformMatrix4fv(this.m_projectionMatrixLocation, false, projection_matrix);
        gl.uniformMatrix4fv(this.m_viewMatrixLocation, false, view_matrix);
        gl.uniform1f(this.m_widthLocation, width);
        gl.uniform4fv(this.m_colorLocation, color);

        // points for start and draw start 
        gl.uniform2fv(this.m_pointALocation, b1);
        gl.uniform2fv(this.m_pointBLocation, a1);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 6);

        // points for end and draw end 
        gl.uniform2fv(this.m_pointALocation, a2);
        gl.uniform2fv(this.m_pointBLocation, b2);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 6);
    }
}