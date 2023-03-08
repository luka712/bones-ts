import { GLVertexBufferUtil } from "../../../webgl/GLVertexBufferUtil";
import { Framework } from "../../Framework";
import { FrameworkContext } from "../../FrameworkContext";
import { Geometry } from "../../geometry/Geometry";
import { Mesh } from "../Mesh";


export class GLMesh extends Mesh
{
    public vao: WebGLVertexArrayObject;
    /**
     * The instance transforms buffer.
     */
    public transformsBuffer: WebGLBuffer;


    /**
     * One of gl.UNSIGNED_SHORT | gl.UNSIGNED_INT
     */
    public indexFormat: number;

    private m_indicesBuffer: WebGLBuffer;
    private m_vertexPositionsBuffer: WebGLBuffer;
    private m_vertexColorsBuffer: WebGLBuffer;

    constructor(private m_framework: Framework, private m_geometry: Geometry, maxInstances = 1) 
    {
        super(maxInstances);
        this.indicesCount = m_geometry.indices.length;
    }

    /**
     * Creates and maps to buffer for indices.
     */
    private initializeIndicesBuffer (): WebGLBuffer
    {
        const gl = FrameworkContext.gl;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.m_geometry.indices, gl.STATIC_DRAW);

        const byteSize = this.m_geometry.indices.BYTES_PER_ELEMENT;
        if (byteSize == 2)
        {
            this.indexFormat = gl.UNSIGNED_SHORT;
        }
        else if (byteSize == 4)
        {
            this.indexFormat = gl.UNSIGNED_INT;
        }
        else
        {
            throw new Error(`GLMesh::initializeIndicesBuffer: unhandled byte size. ${byteSize}`)
        }

        return buffer;

    }

    private intitializePositionsBuffer (): WebGLBuffer
    {
        const gl = FrameworkContext.gl;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.m_geometry.vertexPositions, gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        return buffer;
    }

    private intitializeColorsBuffer (): WebGLBuffer
    {
        const gl = FrameworkContext.gl;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.m_geometry.vertexColors, gl.STATIC_DRAW);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(1);

        return buffer;
    }

    /**
     * Initiailize the buffer for transform matrix instances. 
     */
    private initializeTransformsBuffer (): WebGLBuffer 
    {
        const gl = FrameworkContext.gl;

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, Float32Array.BYTES_PER_ELEMENT * 16 * this.maxInstances, gl.STREAM_DRAW);
        GLVertexBufferUtil.allocateMatrixAttribPointer(gl, 2, 1);

        return buffer;
    }


    public initialize (): void 
    {
        const gl = FrameworkContext.gl;

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        this.m_indicesBuffer = this.initializeIndicesBuffer();
        this.m_vertexPositionsBuffer = this.intitializePositionsBuffer();
        this.m_vertexColorsBuffer = this.intitializeColorsBuffer();
        this.transformsBuffer = this.initializeTransformsBuffer();

        gl.bindVertexArray(null);
    }

    public destroy (): void 
    {
        const gl = FrameworkContext.gl;

        gl.deleteBuffer(this.m_indicesBuffer);
        gl.deleteBuffer(this.m_vertexPositionsBuffer);
        gl.deleteBuffer(this.m_vertexColorsBuffer);
        gl.deleteBuffer(this.transformsBuffer);

        gl.deleteVertexArray(this.vao);
    }
}