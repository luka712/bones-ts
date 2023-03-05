import { Camera } from "../camera/Camera";
import { Mesh } from "../mesh/Mesh";
import { Material } from "./Material";

export abstract class RenderBackendWrapper 
{
    public abstract initialize(): void;

    /**
     * Renders the passed in object.
     * @param camera 
     * @param mesh 
     * @param material 
     */
    public abstract render (camera: Camera, mesh: Mesh, material: Material) : void;
}