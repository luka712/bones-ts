import { Material } from "../Material";
import { RenderBackendWrapper } from "../RenderBackendWrapper";

export enum MaterialType 
{
    BasicMaterial = "basic_material",
}

/**
 * Material manager will contains either WebGLShaderProgram wrapper or GPURenderPipeline wrapper necessary to render a material.
 */
export abstract class MaterialManager
{
    public backendWrappers: { [id: string ]: RenderBackendWrapper} = {};

    public abstract initialize(): void;

    /**
     * Provider the rendering backend, either WebGLShaderProgramWrapper or GPURenderPipelineWrapper
     * @param material - the material to render.
     */
    public provide(material: Material) : RenderBackendWrapper
    {
        return this.backendWrappers[material.type];
    }
}