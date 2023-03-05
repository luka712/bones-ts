import { Color } from "../bones_math";
import { MaterialType } from "./manager/MaterialManager";
import { Material } from "./Material";

export class BasicMaterial implements Material 
{
    readonly type: MaterialType = MaterialType.BasicMaterial;
    public name?: string;
    public diffuseColor: Color = Color.gray();
}