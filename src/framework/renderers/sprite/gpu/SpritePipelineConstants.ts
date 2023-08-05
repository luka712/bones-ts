export class SpriptePipelineConstants 
{
    /**
     * Max instances that can be drawn per draw call.
     */
    public static MAX_INSTANCES = 1000;

    /**
     * Number of floats per vertex.
     */
    public static FLOATS_PER_VERTEX = 9;


    /**
     * Number of floats per instance/sprite.
     */
    public static FLOATS_PER_INSTANCE = 4 * this.FLOATS_PER_VERTEX

    /**
     * The number of bytes per instance.
     */
    public static BYTES_PER_INSTANCE = this.FLOATS_PER_INSTANCE * Float32Array.BYTES_PER_ELEMENT;

}