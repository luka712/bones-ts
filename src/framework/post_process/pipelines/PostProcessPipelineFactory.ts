import { PostProcessPipeline } from "./PostProcessPipeline";

// TODO: rename to post process

export abstract class PostProcessPipelineFactory 
{
    /**
     * Creates the Bloom Effect pipeline.
     */
    public abstract createBloomEffectPipeline(): Promise<PostProcessPipeline>;
}