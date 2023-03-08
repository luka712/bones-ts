import { Mesh } from "./Mesh";

export interface MeshOptions 
{
    /**
     * The max number of instances that can be drawn for mesh. Valid only for WebGL mesh, has no effect on WebGPU mesh.
     * 
     * note: for WebGPU, define maxInstances on a material.
     */
    maxInstances?: number;
}

export interface MeshFactory 
{
    /**
     * Creates the cube mesh.
     */
    createCubeMesh(options? : MeshOptions) : Mesh;
}