import { Framework } from "../Framework";
import { GLBasicMaterial } from "./basic/gl/GLBasicMaterial";
import { BasicMaterial } from "./basic/BasicMaterial";
import { BasicMaterialData, MaterialFactory } from "./MaterialFactory";

export class GLMaterialFactory implements MaterialFactory
{
    constructor(private m_framework: Framework){}

    /**
     * @inheritdoc
     */
    public createBasicMaterial (options?: BasicMaterialData): BasicMaterial
    {
        const material = new GLBasicMaterial(this.m_framework);
        if(options?.diffuseColor)
        {
            material.diffuseColor = options.diffuseColor;
        }

        material.initialize();

        return material;
    }
    
}