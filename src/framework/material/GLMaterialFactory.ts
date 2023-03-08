import { Framework } from "../Framework";
import { GLBasicMaterial } from "./basic/gl/GLBasicMaterial";
import { BasicMaterial } from "./basic/BasicMaterial";
import { BasicMaterialOptions, MaterialFactory } from "./MaterialFactory";

export class GLMaterialFactory implements MaterialFactory
{
    constructor(private m_framework: Framework){}

    /**
     * @inheritdoc
     */
    public createBasicMaterial (options?: BasicMaterialOptions): BasicMaterial
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