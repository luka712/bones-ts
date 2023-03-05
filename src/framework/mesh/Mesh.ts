import { Mat4x4 } from "../bones_math";
import { Framework } from "../Framework";
import { Geometry } from "../geometry/Geometry";
import { WebGPUMesh } from "./WebGPUMesh";

export enum PrimitiveMode
{
    Triangles = 4
}

export class Mesh 
{
    /**
     * The actual mesh implementation, which is either {@link WebGPUMesh} or {@link todo}
     */
    public internalMesh: WebGPUMesh;

    constructor(framework: Framework, geometry: Geometry)
    {
        this.internalMesh = new WebGPUMesh(this, framework, geometry);
    }

    /**
     * Initialize the mesh.
     */
    public initialize (): void 
    {
        this.internalMesh.initialize();
    }

    /**
     * The index of material in scene.
     */
    public material: number = 0;

    /**
     * Should it draw points, lines, triangles and in which mode.
     */
    public primitiveMode: PrimitiveMode = PrimitiveMode.Triangles;

    /**
     * Number of indices to draw.
     */
    public indicesCount: number = 36; // just test

    public transform: Mat4x4 = Mat4x4.identity();
}