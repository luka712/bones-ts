import vertexShaderSource from "./basic_material_vertex_shader.glsl?raw"
import fragmentShaderSource from "./basic_material_fragment_shader.glsl?raw"
import { BasicMaterial } from "../BasicMaterial";
import { GLShaderHandler } from "../../../../webgl/shaders/GLShaderHandler";
import { Mat4x4 } from "../../../bones_math";
import { Camera } from "../../../camera/Camera";
import { Framework } from "../../../Framework";
import { FrameworkContext } from "../../../FrameworkContext";
import { GLMesh } from "../../../mesh/gl/GLMesh";
import { Material } from "../../Material";
import { GLProgramUtil } from "../../../../webgl/GLProgramUtil";

/**
 * Holds the GPURenderPipeline and informatio about uniforms buffer and bind groups necessary for drawing the BasicMaterial.
 */
export class GLBasicMaterial extends BasicMaterial 
{

    private m_program: WebGLProgram;

    // global uniform 
    private m_projectionViewMatrixLoc: WebGLUniformLocation;
    private m_transformMatrixLoc: WebGLUniformLocation;
    private m_diffuseColorLoc: WebGLUniformLocation;

    constructor(private m_framework: Framework)
    {
        super();
    }

    /**
     * Initialize the backend wrapper.
     * Creates the render pipeline and all the uniform buffers.
     */
    public initialize (): void 
    {
        const gl = FrameworkContext.gl;

        this.m_program = GLShaderHandler.initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

        this.m_projectionViewMatrixLoc = GLProgramUtil.getUniformLocation(gl, this.m_program, "u_global.projectionViewMatrix");
        this.m_diffuseColorLoc = GLProgramUtil.getUniformLocation(gl, this.m_program, "u_global.diffuseColor");
    }

    /**
     * @inheritdoc 
     */
    public draw (camera: Camera, mesh: GLMesh): void 
    {
        // get necessary information.
        const gl = FrameworkContext.gl;

        gl.useProgram(this.m_program);

        gl.uniformMatrix4fv(this.m_projectionViewMatrixLoc, false, camera.projectionViewMatrix);
        gl.uniform4fv(this.m_diffuseColorLoc, this.diffuseColor);

        gl.bindVertexArray(mesh.vao);

        // buffer subdata
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.transformsBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, mesh.transform, 0, 16);

        // draw
        gl.drawElementsInstanced(gl.TRIANGLES, mesh.indicesCount, mesh.indexFormat, 0, 1);
    }

     /**
     * @inheritdoc
     */
    public drawInstanced (camera: Camera, mesh: GLMesh, transforms: Mat4x4[]): void
    {
        if (transforms.length == 0) return;

        const array = Mat4x4.matricesArrayToSignedArray(transforms);
        this.drawInstancedPrefilled(camera, mesh, array, transforms.length);
    }


    /**
     * @inheritdoc
     */
    public drawInstancedPrefilled (camera: Camera, mesh: GLMesh, flatTransformsArray: Float32Array, nOfInstances: number): void
    {
          // get necessary information.
          const gl = FrameworkContext.gl;

          gl.useProgram(this.m_program);
  
          gl.uniformMatrix4fv(this.m_projectionViewMatrixLoc, false, camera.projectionViewMatrix);
          gl.uniform4fv(this.m_diffuseColorLoc, this.diffuseColor);
  
          gl.bindVertexArray(mesh.vao);
  
          // buffer subdata
          gl.bindBuffer(gl.ARRAY_BUFFER, mesh.transformsBuffer);
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatTransformsArray, 0, 16 * nOfInstances);
  
          // draw
          gl.drawElementsInstanced(gl.TRIANGLES, mesh.indicesCount, mesh.indexFormat, 0, nOfInstances);
    }
    public copy (): Material
    {
        throw new Error("Method not implemented.");
    }
}