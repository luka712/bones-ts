export class BufferUtil 
{
    /**
     * Creates the index buffer and writes the data to it.
     * @param device - GPUDevice
     * @param data - Uint16Array
     * @returns {GPUBuffer}
     */
    public static createIndexBuffer(device: GPUDevice, data: Uint16Array) : GPUBuffer
    {
        const buffer = device.createBuffer({
            size: data.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });

        new Uint16Array(buffer.getMappedRange()).set(data);
        buffer.unmap();
    
        return buffer;
    }

    /**
     * Creates the vertex buffer and writes the data to it.
     * @param device - GPUDevice
     * @param data - Float32Array
     * @returns {GPUBuffer}
     */
    public static createVertexBuffer(device: GPUDevice, data: Float32Array) : GPUBuffer
    {
        const buffer = device.createBuffer({
            size: data.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });

        new Float32Array(buffer.getMappedRange()).set(data);
        buffer.unmap();
    
        return buffer;
    }

    /**
     * Creates the empty vertex buffer of given byte length.
     * @param device - GPUDevice
     * @param byteLength - number of bytes
     * @returns {GPUBuffer}
     */
    public static createEmptyVertexBuffer(device: GPUDevice, byteLength: number) : GPUBuffer
    {
        const buffer = device.createBuffer({
            size: byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        return buffer;
    }
}