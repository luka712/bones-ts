import { Framework } from "../../Framework";
import { WebGPUBasicMaterialRenderBackendWrapper } from "../material/basic/WebGPUBasicMaterialRenderBackendWrapper";
import { MaterialManager, MaterialType } from "./MaterialManager";

export class WebGPUMaterialManager extends MaterialManager
{
    constructor(private m_framework: Framework)
    {
        super();
    }

    /**
     * @inheritdoc
     */
    public initialize (): void
    {
        this.backendWrappers[MaterialType.BasicMaterial] = new WebGPUBasicMaterialRenderBackendWrapper(this.m_framework);


        for(let key in this.backendWrappers)
        {
            this.backendWrappers[key].initialize();
        }
    }
    
}