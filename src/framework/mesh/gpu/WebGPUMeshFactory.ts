
import { Framework } from "../../Framework";
import { Mesh } from "../Mesh";
import { MeshFactory } from "../MeshFactory";
import { WebGPUMesh } from "./WebGPUMesh";

export class WebGPUMeshFactory implements MeshFactory
{
    constructor(private m_framework: Framework) { }

    /**
     * @inheritdoc
     */
    public createCubeMesh (): Mesh
    {
        const cubeGeometry = this.m_framework.geometryBuilder.buildCubeGeometry();
        const mesh = new WebGPUMesh(this.m_framework, cubeGeometry);
        mesh.initialize();
        return mesh;
    }

}