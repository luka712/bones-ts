import { exitCode } from "process";
import { BufferUsage, ComponentType,  DrawType,  GeometryBuffer, IndicesBufferDescription, SharedVertexBufferDescription, VertexBufferDescription } from "../framework/GeometryBuffer";



/**
 * Simple class that represents buffer and location. 
 * Used privately within WebGPUGeometryBuffer
 */
class BufferLayoutLocation 
{
    buffer: GPUBuffer;
    layoutLocation: number;
}

/**
 * Simple class that represents index buffer and it's format.
 * Used privately within WebGPUGeometryBuffer.
 */
class IndexBufferFormat 
{
    buffer: GPUBuffer;
    indexFormat: GPUIndexFormat;
}

export class WebGPUGeometryBuffer implements GeometryBuffer 
{
    /**
     * The bound buffers.
     */
    private m_bufferLayoutLocation: Array<BufferLayoutLocation> = [];

    /**
     * The number of indices.
     */
    private m_indicesCount: number = 0;

    /**
     * The bound index buffer.
     */
    private m_indexBufferFormat?: IndexBufferFormat;

    constructor(private m_device: GPUDevice, vertices_attr: Array<VertexBufferDescription> = null, indices_attr: IndicesBufferDescription = null, shared_buffer: SharedVertexBufferDescription = null)
    {
        // vertex buffers ( positions, texCoords, normals )
        if (vertices_attr)
        {
            for (const attr of vertices_attr)
            {
                const buffer = m_device.createBuffer({
                    size: (attr.data.byteLength + 3) & ~3,
                    usage: GPUBufferUsage.VERTEX,
                    mappedAtCreation: true
                });

                this.fillBuffer(buffer, attr.data, attr.componentType);

                // push buffer to bound ones.
                this.m_bufferLayoutLocation.push({
                    layoutLocation: attr.layoutLocation,
                    buffer
                });
            }
        }

        // index buffer ( indices )
        if (indices_attr)
        {
            // create index buffer and fill it
            const buffer = m_device.createBuffer({
                size: (indices_attr.data.byteLength + 3) & ~3,
                usage: GPUBufferUsage.INDEX,
                mappedAtCreation: true
            });
            this.fillBuffer(buffer, indices_attr.data, indices_attr.componentType);

            // fill in data for use and calls.
            this.m_indexBufferFormat = {
                buffer,
                indexFormat: this.resolveIndexBufferFormat(indices_attr.componentType)
            };
            this.m_indicesCount = indices_attr.count;
        }
    }
 

    /**
     * Returns correct GPUIndexFormat from component_type.
     * @param { ComponentType } component_type 
     * @returns { GPUIndexFormat }
     */
    private resolveIndexBufferFormat (component_type: ComponentType): GPUIndexFormat 
    {
        if (component_type == ComponentType.UNSIGNED_SHORT)
        {
            return 'uint16';
        }
        else 
        {
            throw new Error("WebGPUGeometryBuffer::resolveIndexBufferFormat - Not implemented!");
        }
    }

    /**
     * Fill buffer with data.
     * @param { GPUBuffer } buffer - WebGPU buffer.
     * @param { ArrayBuffer } data - the array buffer data.
     * @param { ComponentType } component_type - the type of data.
     */
    private fillBuffer (buffer: GPUBuffer, data: ArrayBuffer, component_type: ComponentType): void 
    {
        let write_array = null;
        if (component_type == ComponentType.FLOAT) 
        {
            write_array = new Float32Array(buffer.getMappedRange());
        }
        else if (component_type == ComponentType.UNSIGNED_SHORT)
        {
            write_array = new Uint16Array(buffer.getMappedRange());
        }
        else if(component_type == ComponentType.UNSIGNED_BYTE)
        {
            write_array = new Uint8Array(buffer.getMappedRange());
        }
        else 
        {
            throw new Error("WebGPUGeometryBuffer::fillBuffer: Not implemented!");
        }

        write_array.set(data);
        buffer.unmap();
    }

    /**
       * @brief Bind the current buffers.
       * @param { GPURenderPassEncoder } pass_encoder - pass encoder.
       * @returns { void }
       */
    public bind<T> (pass_encoder: T): void 
    {
        for (const buffer_location of this.m_bufferLayoutLocation)
        {
            // location is usually 0 for position, 1 for texCoords etc..
            (pass_encoder as unknown as GPURenderPassEncoder).setVertexBuffer(buffer_location.layoutLocation, buffer_location.buffer);
        }
        if (this.m_indexBufferFormat)
        {
            // format such as 'uint16'
            (pass_encoder as unknown as GPURenderPassEncoder).setIndexBuffer(this.m_indexBufferFormat.buffer, this.m_indexBufferFormat.indexFormat);
        }
    }

    /**
     * @brief Unbind the current VAO.
     *
     */
    public unbind (): void 
    {
        // this.__gl.bindVertexArray(null);
    }

    /**
     * @brief Binds a buffer under index.
     * Index is index of created buffer, so whichever buffer was passed in and internally created.
     *
     * @param { number } buffer_index for example 0 for first buffer in array of buffers.
     * @returns { void }
     */
    public bindBuffer (buffer_index: number): void 
    {
        // Buffer is in array, of arrayBufferIds
        // this.__gl.bindBuffer(this.__gl.ARRAY_BUFFER, this.__arrayBufferIds[buffer_index]);
    }


    /**
     * @brief Add new data to a buffer.
     *
     * @param { ArrayBufferView } buffer_data - data.
     * @param { number } size - size of data.
     * @returns { void }
     */
    public bufferSubData (buffer_data: ArrayBufferView, size: number): void 
    {
        // this.__gl.bufferSubData(this.__gl.ARRAY_BUFFER, 0, buffer_data);
    }

    public transformFeedback (write_into_buffer: GeometryBuffer, n_of_primitves?: number, draw_type?: DrawType)
    {
        throw new Error("Method not implemented.");
    }

    /**
     * @brief Delete the VAO and buffers.
     * @returns { void }
     */
    public delete (): void 
    {
        //    if (!this.__deleted)
        //    {
        //        this.__gl.deleteVertexArray(this.__vaoId);
        //        for (let id of this.__arrayBufferIds)
        //        {
        //            this.__gl.deleteBuffer(id);
        //        }

        //        if (this.__indexBufferId)
        //        {
        //            this.__gl.deleteBuffer(this.__indexBufferId);
        //        }
        //    }
        //    this.__deleted = true;
    }

    /**
     * @brief Draw the element using the VAO.
     * @param { GPURenderPassEncoder } pass_encoder - pass encoder.
     * @returns { void }
     */
    public draw<T> (pass_encoder: T): void 
    {
        // uses index buffer.
        if (this.m_indexBufferFormat)
        {
            (pass_encoder as unknown as GPURenderPassEncoder).drawIndexed(this.m_indicesCount, 1);
        }
        else
        {
            throw new Error("Not implemented!");
        }
    }
}