import { LifecycleState } from "../../framework/bones_common";
import { Framework } from "../../framework/Framework";

/**
 * The special geometry class, which contains a quad that covers whole screen if used without matrices.
 * For use in post processing mostly or rendering to a texture.
 * 
 * Works if vec3 for positions and vec2 for tex coordiantes within shader is used.
 */
export class GLScreenQuadGeometry 
{
    private m_vao: WebGLVertexArrayObject;
    private m_buffer: WebGLBuffer;
    private m_iBuffer: WebGLBuffer;

    private m_state: LifecycleState = LifecycleState.Created;

    constructor(private m_gl: WebGL2RenderingContext)
    {

    }

    /**
     * Initialize. Creates and fills buffers.
     */
    public intialize (): void
    {
        // if it's already initialized, no need to do it again.
        if(this.m_state == LifecycleState.Initialized) return;

        this.m_state = LifecycleState.Initialized;

        const gl = this.m_gl;

        // create vao
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const data = new Float32Array([
            -1, -1, 0, 0, 0,		// bottom left corner
            -1, 1, 0, 0, 1,			// top left corner
            1, 1, 0, 1, 1,			// top right corner
            1, -1, 0, 1, 0			// bottom right corner
        ]);


        // just one array buffer is needed
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

        // vec3 for positions + vec2 for tex coords.
        const stride = 5 * Float32Array.BYTES_PER_ELEMENT;

        // positions. Layout location = 0
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(0);

        // textures. Layout location = 1
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(1);

        // indices
        const i_data = new Uint8Array([
            0, 1, 2,  // first triangle (bottom left - top left - top right)
            0, 2, 3 // second triangle (bottom left - top right - bottom right))
        ]);

        const i_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, i_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, i_data, gl.STATIC_DRAW);

        gl.bindVertexArray(null);

        this.m_vao = vao;
        this.m_buffer = buffer;
        this.m_iBuffer = i_buffer;
    }

    /**
     * Binds the buffer for usage.
     */
    public bind (): void 
    {
        this.m_gl.bindVertexArray(this.m_vao);
    }

    public draw() : void 
    {
        this.m_gl.drawElements(this.m_gl.TRIANGLES, 6, this.m_gl.UNSIGNED_BYTE, 0);
    }

    /**
     * Destroys the buffers.
     */
    public destroy (): void 
    {
        const gl = this.m_gl;

        gl.deleteVertexArray(this.m_vao);
        gl.deleteBuffer(this.m_buffer);
        gl.deleteBuffer(this.m_iBuffer);
    }

    private static m_instance : GLScreenQuadGeometry;

    /**
     * Gets the instance of geometry. This way it can be reused many times.
     */
    public static get instance() : GLScreenQuadGeometry 
    {
        if(!this.m_instance)
        {
            this.m_instance = new GLScreenQuadGeometry(Framework.gl);
        }
        return this.m_instance;
    }
}