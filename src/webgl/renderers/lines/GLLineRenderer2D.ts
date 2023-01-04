import { Color, Vec2 } from "../../../framework/bones_math";
import { Framework } from "../../../framework/Framework";
import { LineJoin, LineRenderer2D } from "../../../framework/renderers/LineRenderer2D";
import { Blend } from "../../../framework/SpriteRenderer";
import { GLShaderImplementation } from "../../shaders/GLShaderImplementation";
import { GLBlendModeUtil } from "../common/GLBlendModeUtil";
import { ShaderSource } from "../common/ShaderSource";
import { GLLineJoinBevel } from "./joins/GLLineJoinBevel";
import { GLLineJoinMiter } from "./joins/GLLineJoinMiter";
import { GLLineJoinRound } from "./joins/GLLineJoinRound";

// HOW IT WORKS


// it renders a quad
// quad triangles are renderer same for each instance
// the rest of data, such as point a positon, point b position, weight and color is set per instance

const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

layout (location = 0) in vec2 a_position;
layout (location = 1) in vec2 a_pointA;
layout (location = 2) in vec2 a_pointB; 

uniform mat4 u_projection_matrix;
uniform mat4 u_view_matrix;
uniform float u_width;

void main()
{
    float width = u_width;

    // get x basis, which is just direction from a towards b
    vec2 x_basis = a_pointB - a_pointA;
    // get y basic, which is normal unit vector of x basis.
    vec2 y_basis = normalize(vec2(-x_basis.y, x_basis.x));

    vec2 point = a_pointA + x_basis * a_position.x + y_basis * width * a_position.y; 
    gl_Position = u_projection_matrix * u_view_matrix * vec4(point, 0.0, 1.0);
}
`;


// number of points that can be drawn at once, before another draw call.
const NUM_MAX_INSTANCES = 10000;
// points vec2 a, vec2 b
export const GL_LINE_RENDERER_STRIDE = 4 * Float32Array.BYTES_PER_ELEMENT;

export class GLLineRenderer2D extends LineRenderer2D
{
    // private 
    private m_gl: WebGL2RenderingContext;

    // buffers and data
    private m_vao: WebGLVertexArrayObject;
    private m_pointsBuffer: WebGLBuffer;
    private m_linesData: Float32Array; // a,b points are line
    private m_currentInstanceIndex = 0;

    // shader stuff
    private m_shader: GLShaderImplementation;
    private m_viewMatrixLocation: WebGLUniformLocation;
    private m_projectionMatrixLocation: WebGLUniformLocation;
    private m_widthLocation: WebGLUniformLocation;
    private m_colorLocation: WebGLUniformLocation;

    // default
    private o_color = Color.white();

    /**
     * Defines a join to be used between lines.
     */
    private m_join = {
        [LineJoin.ROUND]: new GLLineJoinRound(),
        [LineJoin.MITER]: new GLLineJoinMiter(),
        [LineJoin.BEVEL]: new GLLineJoinBevel(),
    }

    constructor(framework: Framework)
    {
        super();

        this.m_gl = Framework.gl;

        framework.window.subscribeToWindowResized((e) => 
        {
            this.resize(e.width, e.height);
        });

        this.resize(framework.window.width, framework.window.height);
    }

    /**
     * Initialize the geometry buffers.
     */
    private initializeBuffers (): void 
    {
        // https://wwwtyro.net/2019/11/18/instanced-lines.html

        // is a quad of 2 triangles, which will be used for line
        const segment_data = new Float32Array(
            [
                // t1
                0, -0.5,
                1, -0.5,
                1, 0.5,
                // t2
                0, -0.5,
                1, 0.5,
                0, 0.5
            ]
        )


        const gl = this.m_gl;

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // Position buffer.
        const position_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, segment_data, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        // no division, each instance has same position.
        gl.vertexAttribDivisor(0, 0);


        // Points buffer. 5 for vec2 a point, vec2 b point, float width
        this.m_linesData = new Float32Array(NUM_MAX_INSTANCES * GL_LINE_RENDERER_STRIDE);

        const points_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, points_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.m_linesData, gl.STREAM_DRAW);

        // point a
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, GL_LINE_RENDERER_STRIDE, 0);
        gl.vertexAttribDivisor(1, 1);

        // point b
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, GL_LINE_RENDERER_STRIDE, 2 * Float32Array.BYTES_PER_ELEMENT);
        gl.vertexAttribDivisor(2, 1);

        // unbind
        gl.bindVertexArray(null);

        this.m_vao = vao;
        this.m_pointsBuffer = points_buffer;

        for (let key in this.m_join)
        {
            this.m_join[key].initialize(gl, points_buffer);
        }
    }

    private async initializeShaders (): Promise<void>
    {
        const shader = new GLShaderImplementation(this.m_gl, VERTEX_SHADER_SOURCE, ShaderSource.UNIFORM_COLOR_FRAGMENT_SOURCE);

        //const vertex_source = await this.m_fileLoader.loadFile("assets/framework/shaders/shapes/lines2D_v_webgl.glsl")
        //const fragment_source = await this.m_fileLoader.loadFile("assets/framework/shaders/shapes/lines2D_f_webgl.glsl");

        await shader.initialize();
        // await shader.initialize(vertex_source, fragment_source);

        this.m_viewMatrixLocation = shader.getUniformLocation("u_view_matrix", true);
        this.m_projectionMatrixLocation = shader.getUniformLocation("u_projection_matrix", true);
        this.m_widthLocation = shader.getUniformLocation("u_width", true);
        this.m_colorLocation = shader.getUniformLocation("u_color", true);

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
    private glDraw (join: LineJoin, width: number, color: Color): void 
    {
        const gl = this.m_gl;

        // use and set shader vars
        this.m_shader.use();
        gl.uniformMatrix4fv(this.m_projectionMatrixLocation, false, this.m_projectionMatrix);
        gl.uniformMatrix4fv(this.m_viewMatrixLocation, false, this.m_viewMatrix);
        gl.uniform1f(this.m_widthLocation, width);
        gl.uniform4fv(this.m_colorLocation, color);

        // bind vao
        gl.bindVertexArray(this.m_vao);

        // buffer subdata
        gl.bindBuffer(gl.ARRAY_BUFFER, this.m_pointsBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.m_linesData, 0, this.m_currentInstanceIndex * GL_LINE_RENDERER_STRIDE);

        // draw
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.m_currentInstanceIndex);

        this.m_join[join].draw(this.m_currentInstanceIndex, this.m_projectionMatrix, this.m_viewMatrix, width, color);

        // reset index.
        this.m_currentInstanceIndex = 0;
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
     * Draw inner is just helper function to lower code reuse. Increases the current index on each draw.
     * @param points - array of vec2 points to draw.
     * @param width - the width of a line. By default 10.
     * @param color - the color of a line, by default white.
     * @param join - the type of a line join.
     */
    private drawInner (points: Array<Vec2>, width = 10, color: Color = null, join: LineJoin): void 
    {
        const gl = this.m_gl;

        // reset stuff.
        this.m_currentInstanceIndex = 0;

        if (!color)
        {
            color = this.o_color;
        }

        // data
        const d = this.m_linesData;

        let k = 0;
        for (let i = 0; i < points.length - 1; i += 1)
        {
            const a = points[i];
            const b = points[i + 1];

            // it has 1 value per instance, therefore not necessary to multiply 6 times.
            d[k++] = a.x;
            d[k++] = a.y;

            d[k++] = b.x;
            d[k++] = b.y;

            this.m_currentInstanceIndex++;

            // minus 1 due to line joins
            if (this.m_currentInstanceIndex >= NUM_MAX_INSTANCES)
            {
                k = 0;
                this.glDraw(join, width, color);
            }
        }

        this.glDraw(join, width, color);
    }

    /**
     * @inheritdoc
     */
    public draw (points: Array<Vec2>, width = 10, color: Color = null, join: LineJoin = LineJoin.ROUND): void 
    {
        this.drawInner(points, width, color, join);
    }

    /**
     * @inheritdoc
     */
    public end (): void 
    {
    }
}