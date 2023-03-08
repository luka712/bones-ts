import { Mat4x4 } from "../bones_math";
import { Camera } from "../camera/Camera";
import { Material } from "../material/Material";

export enum PrimitiveMode
{
    Triangles = 4
}

export abstract class Mesh 
{

    /**
     * 
     * @param maxInstances the max instances to draw. Only has effect for WebGLRenderer, no effect on WebGPU renderer.
     */
    constructor(public readonly maxInstances = 1)
    {

    }

    /**
     * Initialize the mesh.
     */
    public abstract initialize (): void;

    /**
     * The index of material in scene.
     */
    public materials: Array<Material> = [];

    /**
     * Should it draw points, lines, triangles and in which mode.
     */
    public primitiveMode: PrimitiveMode = PrimitiveMode.Triangles;

    /**
     * The transform matrix of a mesh.
     */
    public transform: Mat4x4 = Mat4x4.identity();

    /**
     * The number of indices to draw.
     */
    public indicesCount: number;

    public draw (camera: Camera)
    {
        for (let material of this.materials)
        {
            material.draw(camera, this);
        }
    }

    public abstract destroy (): void;
}
