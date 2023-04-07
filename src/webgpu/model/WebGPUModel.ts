import { Mat4x4 } from "../../framework/bones_math";
import { WebGPUBasicMaterial } from "../../framework/material/basic/gpu/WebGPUBasicMaterial";
import { WebGPUMesh } from "../../framework/mesh/gpu/WebGPUMesh";

export class WebGPUModel 
{
    public mesh: WebGPUMesh;
    public material: WebGPUBasicMaterial;
    public transform: Mat4x4 = Mat4x4.identity();
}