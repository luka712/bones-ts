
import { Framework } from "../../Framework";
import { Mesh } from "../Mesh";
import { MeshFactory, MeshOptions } from "../MeshFactory";
import { GLMesh } from "./GLMesh";

export class GLMeshFactory implements MeshFactory
{
    constructor(private m_framework: Framework) { }

    /**
     * @inheritdoc
     */
    public createCubeMesh (options?: MeshOptions): Mesh
    {
        const cubeGeometry = this.m_framework.geometryBuilder.buildCubeGeometry();
        const mesh = new GLMesh(this.m_framework, cubeGeometry, options?.maxInstances);
        mesh.initialize();
        return mesh;
    }

}