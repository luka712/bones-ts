export class BufferUtil {
    /**
     * Creates the index buffer and writes the data to it.
     * @param device - GPUDevice
     * @param data - Uint16Array
     * @returns {GPUBuffer}
     */
    public static createIndexBuffer (device: GPUDevice, data: Uint16Array): GPUBuffer {
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
    public createVertexBuffer (device: GPUDevice, data: Float32Array, label = "Vertex Buffer"): GPUBuffer {
        const buffer = device.createBuffer({
            label,
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
     * @param device GPUDevice
     * @param byteLength number of bytes
     * @param label The buffer label. By default set to "Vertex Buffer"
     * @returns @see {@link GPUBuffer}
     */
    public static createEmptyVertexBuffer (device: GPUDevice, byteLength: number, label = "Vertex Buffer"): GPUBuffer {
        const buffer = device.createBuffer({
            size: byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        return buffer;
    }

    /**
     * Create the uniform buffer.
     * @param device The device.
     * @param byteLength The byte length of a buffer.
     * @param data The data, if any. If provided data will be copied to the buffer.
     * @param label The buffer label. By default set to "uniform buffer"
     * @returns The @see {@link GPUBuffer}
     */
    public static createUniformBuffer (device: GPUDevice,
        byteLength: number,
        data: Float32Array | null = null,
        label = "uniform buffer"): GPUBuffer {
        const buffer = device.createBuffer({
            label,
            size: byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        if (data) {
            device.queue.writeBuffer(buffer, 0, data.buffer, data.byteOffset, data.byteLength);
        }

        return buffer;
    }
}