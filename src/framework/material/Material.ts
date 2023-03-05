import { Color } from "../bones_math";
import { MaterialType } from "./manager/MaterialManager";

export interface Material 
{
    readonly type: MaterialType;
    name?: string;
    diffuseColor?: Color;
}