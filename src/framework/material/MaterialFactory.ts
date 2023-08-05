import { Color } from "../bones_math";
import { BasicMaterial } from "./basic/BasicMaterial";

export interface BasicMaterialData 
{
    diffuseColor?:Color;

    /**
     * The max instances to draw. Only has effect on WebGPU renderer.
     * For WebGL renderer, pass maxInstances to mesh instead.
     * 
     * note: not supported for WebGL.
     */
    maxInstances?: number;
}

export interface MaterialFactory 
{
    /**
     * Creates the basic material.
     */
    createBasicMaterial(options?: BasicMaterialData) : BasicMaterial;
}