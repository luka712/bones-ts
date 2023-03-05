import { WebGPUBasicMaterial } from "./basic/WebGPUBasicMaterial";
import { WebGPUBasicMaterialRenderPipelineWrapper } from "./basic/WebGPUBasicMaterialRenderPipelineWrapper";

export class WebGPUMaterialManager 
{
    public static basicMaterialPipeline?: WebGPUBasicMaterialRenderPipelineWrapper;

    public createBasicMaterial() : WebGPUBasicMaterial 
    {
        if(!WebGPUMaterialManager.basicMaterialPipeline)
        {
            WebGPUMaterialManager.basicMaterialPipeline = new WebGPUBasicMaterialRenderPipelineWrapper();
            WebGPUMaterialManager.basicMaterialPipeline.initialize();
        }

        return new WebGPUBasicMaterial();
    }
}