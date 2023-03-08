import { Color, Mat4x4 } from "../bones_math";
import { Camera } from "../camera/Camera";
import { Mesh } from "../mesh/Mesh";

export abstract class Material 
{
    /**
     * The name of material.
     */
    name?: string;

    /**
     * The diffuse color of a material.
     */
    diffuseColor: Color = Color.white();

    /**
     * 
     * @param maxInstances max instances that can be drawn. Only has effect on WebGPU renderer. No effect on WebGL renderer.
     */
    constructor(public readonly maxInstances = 1)
    {
        this.maxInstances = maxInstances;
    }

    public abstract initialize (): void;

    /**
     * Renders the passed in object.
     * @param camera 
     * @param mesh 
     */
    public abstract draw (camera: Camera, mesh: Mesh): void;


    /**
     * Renders the multiple mesh multiple times. 
     * If transforms array is empty, call is ignored.
     * @param camera 
     * @param mesh 
     * @param transforms if empty, call is ignored.
     */
    public abstract drawInstanced (camera: Camera, mesh: Mesh, transforms: Array<Mat4x4>): void;

    /**
     * Renders the multiple mesh multiple times. 
     * Use flat transforms array where array is already prefilled with matrices. Avoids copying of transforms to buffer.
     * @param camera 
     * @param mesh 
     * @param transforms if empty, call is ignored.
     * @param nOfInstances the number of instances to draw.
     */
    public abstract drawInstancedPrefilled (camera: Camera, mesh: Mesh, flatTransformsArray: Float32Array, nOfInstances: number): void;

    /*
     * Copies the material.
     */
    public abstract copy (): Material;
} 