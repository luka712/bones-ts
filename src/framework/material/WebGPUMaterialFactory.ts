import { Framework } from "../Framework";
import { BasicMaterial } from "./basic/BasicMaterial";
import { WebGPUBasicMaterial } from "./basic/gpu/WebGPUBasicMaterial";
import { BasicMaterialData, MaterialFactory } from "./MaterialFactory";

export class WebGPUMaterialFactory implements MaterialFactory
{
    constructor(private m_framework: Framework){}

    /**
     * @inheritdoc
     */
    public createBasicMaterial (options?: BasicMaterialData): BasicMaterial
    {
        const material = new WebGPUBasicMaterial(this.m_framework, options?.maxInstances);
        if(options?.diffuseColor)
        {
            material.diffuseColor = options.diffuseColor;
        }

        material.initialize();

        return material;
    }
    
}