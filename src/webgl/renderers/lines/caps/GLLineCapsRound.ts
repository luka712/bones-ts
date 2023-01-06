import { Color, Mat4x4, Vec2 } from "../../../../framework/bones_math";
import { GLLineCaps, LineDrawAdditionalContext } from "../../../../framework/renderers/LineRenderer2D";
import { GLShaderImplementation } from "../../../shaders/GLShaderImplementation";
import { ShaderSource } from "../../common/ShaderSource";



const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

layout (location = 0) in vec2 a_position;

uniform vec2 u_point;
uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform float u_width;

void main() 
{
    gl_Position = u_projectionMatrix* u_viewMatrix* vec4(u_width * a_position + u_point, 0.0, 1.0);
}`;

/**
 * Class that will create round line join for {@link GLLineRenderer2D}
 */
export class GLLineCapsRound  implements GLLineCaps
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
    private m_pointLocation: WebGLUniformLocation;

    /**
     * Initialize the buffers.
     * @param points_buffer - the buffer, initialized by {@link GLLineRenderer2D} which holds points data.
     */
    private initializeBuffers (): void 
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
       

        this.m_vao = vao;
        this.m_count = positions.length / 2;
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
        const gl = this.m_gl;

        const a = points[0];
        const b = points[points.length - 1];

        gl.bindVertexArray(this.m_vao);

        this.m_shader.use();

        // camera
        gl.uniformMatrix4fv(this.m_projectionMatrixLocation, false, projection_matrix);
        gl.uniformMatrix4fv(this.m_viewMatrixLocation, false, view_matrix);
        gl.uniform1f(this.m_widthLocation, width);
        gl.uniform4fv(this.m_colorLocation, color);

        // draw start point
        gl.uniform2fv(this.m_pointLocation, a);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.m_count);

        
        // draw end point
        gl.uniform2fv(this.m_pointLocation, b);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.m_count);
    }
}