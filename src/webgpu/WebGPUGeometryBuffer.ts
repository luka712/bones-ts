import { BufferUsage, ComponentType, DrawType, GeometryBuffer, IndicesBufferDescription, SharedVertexBufferDescription, VertexBufferDescription } from "../framework/GeometryBuffer";
import { WebGPURenderer } from "./WebGPURenderer";

// to read https://github.com/toji/webgpu-best-practices/blob/main/buffer-uploads.md

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
     * The dictionary of buffers that are used to buffer subdata.
     * Index is layoutLocation.
     * @see [usage pattern](https://github.com/toji/webgpu-best-practices/blob/main/buffer-uploads.md)
     */
    private m_stagingBuffer: { [id: string]: Array<GPUBuffer> } = {};

    /**
     * The number of indices.
     */
    private m_indicesCount: number = 0;

    /**
     * The bound index buffer.
     */
    private m_indexBufferFormat?: IndexBufferFormat;

    /**
     * The bound buffer index.
     */
    private m_boundIndex: number = 0;

    constructor(private m_renderer: WebGPURenderer, vertices_attr: Array<VertexBufferDescription> = null, indices_attr: IndicesBufferDescription = null, shared_buffer: SharedVertexBufferDescription = null)
    {
        // useful https://github.com/toji/webgpu-best-practices/blob/main/buffer-uploads.md

        this.handleVerticesBufferAttr(vertices_attr);
        this.handleIndicesBufferAttr(indices_attr);
        this.handleSharedBufferAttr(shared_buffer);
    }

    /**
  * Checks shared buffer for errors.
  * @param { SharedVertexBufferDescription } attr 
  */
    private validateSharedBuffer (attr: SharedVertexBufferDescription): void 
    {
        if (attr)
        {
            if (!Array.isArray(attr.sharedVertexBufferItems) || attr.sharedVertexBufferItems.length == 0)
            {
                throw new Error("SharedVertexBufferDescription must contains entries in 'sharedVertexBufferItems'!");
            }
        }
    }

    /**
     * Handles the shared buffer attributes.
     * @param shared_buffer 
     */
    private handleSharedBufferAttr (shared_buffer: SharedVertexBufferDescription): void 
    {
        if (!shared_buffer) return;

        this.validateSharedBuffer(shared_buffer);

        // default, if written once and never changes.
        let usage = GPUBufferUsage.VERTEX;

        // if it needs to written into often.
        if (shared_buffer.bufferUsage == BufferUsage.DYNAMIC_DRAW)
        {
            usage |= GPUBufferUsage.COPY_DST;
        }
        const buffer = this.m_renderer.device.createBuffer({
            size: (shared_buffer.data.byteLength + 3) & ~3,
            usage: usage,
            mappedAtCreation: true,
        });

        this.fillBuffer(buffer, shared_buffer.data, ComponentType.FLOAT);

        // push buffer to bound ones.
        this.m_bufferLayoutLocation.push({
            layoutLocation: 0,
            buffer
        });

    }

    /**
     * Handles vertices buffer attributes.
     * @param vertices_attr 
     */
    private handleVerticesBufferAttr (vertices_attr: Array<VertexBufferDescription>): void 
    {
        // vertex buffers ( positions, texCoords, normals )
        if (vertices_attr)
        {
            for (const attr of vertices_attr)
            {
                // default, if written once and never changes.
                let usage = GPUBufferUsage.VERTEX;

                // if it needs to written into often.
                if (attr.bufferUsage == BufferUsage.DYNAMIC_DRAW)
                {
                    usage |= GPUBufferUsage.COPY_DST;
                }
                const buffer = this.m_renderer.device.createBuffer({
                    label: attr.layoutLocation.toString(),
                    size: (attr.data.byteLength + 3) & ~3,
                    usage: usage,
                    mappedAtCreation: true,
                });

                this.fillBuffer(buffer, attr.data, attr.componentType);

                // push buffer to bound ones.
                this.m_bufferLayoutLocation.push({
                    layoutLocation: attr.layoutLocation,
                    buffer,
                });
            }
        }

    }

    /**
     * Handles the indices buffer.
     * @param indices_attr 
     */
    private handleIndicesBufferAttr (indices_attr: IndicesBufferDescription): void 
    {
        // index buffer ( indices )
        if (indices_attr)
        {
            // create index buffer and fill it
            const buffer = this.m_renderer.device.createBuffer({
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
     * @param data - the array buffer data.
     * @param { ComponentType } component_type - the type of data.
     * @param offset where to start in buffer.
     * @param size the size of buffer.
     */
    private fillBuffer (buffer: GPUBuffer, data: ArrayBuffer | ArrayBufferView, component_type: ComponentType, offset?: number, size?: number): void 
    {
        let write_array = null;
        // for subdata pass 2nd and third param.

        if (component_type == ComponentType.FLOAT) 
        {
            write_array = new Float32Array(buffer.getMappedRange());
        }
        else if (component_type == ComponentType.UNSIGNED_SHORT)
        {
            write_array = new Uint16Array(buffer.getMappedRange());
        }
        else if (component_type == ComponentType.UNSIGNED_BYTE)
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
        this.m_boundIndex = buffer_index;
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
        // see https://github.com/toji/webgpu-metaballs/blob/main/js/webgpu-renderer/webgpu-metaball-renderer.js#L137 staging buffers
        // see https://gpuweb.github.io/gpuweb/explainer/#buffer-mapping
        const buffer = this.m_bufferLayoutLocation[this.m_boundIndex].buffer;

        // try find one write buffer
        let write_buffer = this.m_stagingBuffer[this.m_boundIndex]?.pop();

        // if it does not exist, create one
        if (!write_buffer)
        {
            // check also if array is initialized, if not initialize one.
            if (!this.m_stagingBuffer[this.m_boundIndex])
            {
                this.m_stagingBuffer[this.m_boundIndex] = [];
            }

            write_buffer = this.m_renderer.device.createBuffer({
                size: buffer.size,
                usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC,
                mappedAtCreation: true,
            });
        }

        this.fillBuffer(write_buffer, buffer_data, ComponentType.FLOAT);

        const command_encoder = this.m_renderer.device.createCommandEncoder();
        command_encoder.copyBufferToBuffer(write_buffer, 0, buffer, 0, buffer.size);
        this.m_renderer.device.queue.submit([command_encoder.finish()]);

        write_buffer.mapAsync(GPUMapMode.WRITE)
            .then(() => this.m_stagingBuffer[this.m_boundIndex].push(write_buffer));
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