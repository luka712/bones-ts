
// to read https://github.com/toji/webgpu-best-practices/blob/main/buffer-uploads.md

import { QuadGeometry } from "../../framework/geometry/bones_geometry";
import { WebGPURendererContext } from "../../framework/renderer/Renderer";

// OBSOLETE
export class WebGPUSpriteGeometryBuffer
{
    private m_verticesBuffer: GPUBuffer;
    private m_texCoordsBuffer: GPUBuffer;
    private m_indicesBuffer: GPUBuffer;
    private m_indexFormat: GPUIndexFormat = 'uint16';

    /**
     * The staging buffers.
     * @see [usage pattern](https://github.com/toji/webgpu-best-practices/blob/main/buffer-uploads.md)
     */
    private m_texCoordsStagingBuffers: Array<GPUBuffer> = [];
    private m_verticesStagingBuffers: Array<GPUBuffer> = [];

    /**
     * The bound buffer index.
     */
    private m_boundIndex: number = 0;

    constructor(private m_ctx: WebGPURendererContext)
    {
        // useful https://github.com/toji/webgpu-best-practices/blob/main/buffer-uploads.md

    }

    public initialize (): void 
    {
        const device = this.m_ctx.device;

        const geometry = new QuadGeometry();

        const vertices = geometry.vertices;
        const tex_coords = geometry.textureCoords;
        const indices = geometry.indices;

        // POSITIONS
        const vertices_buffer = device.createBuffer({
            label: "vertices",
            size: (vertices.byteLength + 3) & ~3,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });
        const write_vertices_array = new Float32Array(vertices_buffer.getMappedRange());
        write_vertices_array.set(vertices);
        vertices_buffer.unmap();

        // TEX COORDS
        const tex_coords_buffer = device.createBuffer({
            label: "tex_coords",
            size: (tex_coords.byteLength + 3) & ~3,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });
        const write_tex_array = new Float32Array(tex_coords_buffer.getMappedRange());
        write_tex_array.set(tex_coords);
        tex_coords_buffer.unmap();

        // INDICES
        const indices_buffer = device.createBuffer({
            size: indices.length,
            usage: GPUBufferUsage.INDEX,
            mappedAtCreation: true
        });
        const write_indices_array = new Uint16Array(indices_buffer.getMappedRange());
        write_indices_array.set(indices);
        indices_buffer.unmap();

        this.m_verticesBuffer = vertices_buffer;
        this.m_texCoordsBuffer = tex_coords_buffer;
        this.m_indicesBuffer = indices_buffer;
    }

    public bind (): void 
    {
        const pass_encoder = this.m_ctx.currentRenderPassEncoder;

        pass_encoder.setVertexBuffer(0, this.m_verticesBuffer);
        pass_encoder.setVertexBuffer(1, this.m_texCoordsBuffer);
        pass_encoder.setIndexBuffer(this.m_indicesBuffer, this.m_indexFormat);
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
     * Takes care of staging buffer, gets or creates one, writes data into it, and returns buffer.
     * @param data 
     * @returns 
     */
    private fillTexCoordsBufferAndReturnBuffer (data: Float32Array): GPUBuffer 
    {
        // 1. get or create staging buffer ( write ) 

        // try find one write buffer
        let write_buffer = this.m_texCoordsStagingBuffers.pop();

        // if it does not exist, create one
        if (!write_buffer)
        {
            write_buffer = this.m_ctx.device.createBuffer({
                size: this.m_texCoordsBuffer.size,
                usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC,
                mappedAtCreation: true,
            });
        }

        // 2. write data into staging buffer.
        var array = new Float32Array(write_buffer.getMappedRange());
        array.set(data);
        write_buffer.unmap();

        return write_buffer;
    }

    /**
     * Set the texture coords data.
     * @param data 
     */
    public setTexCoords (data: Float32Array): void 
    {
        const write_buffer = this.fillTexCoordsBufferAndReturnBuffer(data);

        // encode a command
        const command_encoder = this.m_ctx.device.createCommandEncoder();
        command_encoder.copyBufferToBuffer(write_buffer, 0, this.m_texCoordsBuffer, 0, this.m_texCoordsBuffer.size);
        this.m_ctx.device.queue.submit([command_encoder.finish()]);

        write_buffer.mapAsync(GPUMapMode.WRITE)
            .then(() => this.m_texCoordsStagingBuffers.push(write_buffer));
    }

    /**
    * Takes care of staging buffer, gets or creates one, writes data into it, and returns buffer.
    * @param data 
    * @returns 
    */
    private fillVerticesBufferAndReturnBuffer (data: Float32Array): GPUBuffer 
    {
        // 1. get or create staging buffer ( write ) 

        // try find one write buffer
        let write_buffer = this.m_verticesStagingBuffers.pop();

        // if it does not exist, create one
        if (!write_buffer)
        {
            write_buffer = this.m_ctx.device.createBuffer({
                size: this.m_verticesBuffer.size,
                usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC,
                mappedAtCreation: true,
            });
        }

        // 2. write data into staging buffer.
        var array = new Float32Array(write_buffer.getMappedRange());
        array.set(data);
        write_buffer.unmap();

        return write_buffer;
    }

    /**
      * Set the texture coords data.
      * @param data 
      */
    public setVertices (data: Float32Array): void 
    {
        const write_buffer = this.fillVerticesBufferAndReturnBuffer(data);

        // encode a command
        const command_encoder = this.m_ctx.device.createCommandEncoder();
        command_encoder.copyBufferToBuffer(write_buffer, 0, this.m_verticesBuffer, 0, this.m_verticesBuffer.size);
        this.m_ctx.device.queue.submit([command_encoder.finish()]);

        write_buffer.mapAsync(GPUMapMode.WRITE)
            .then(() => this.m_verticesStagingBuffers.push(write_buffer));
    }

    public setVerticesAndTexCoords (vertices_data: Float32Array, texcoords_data: Float32Array): void 
    {
        const v_write_buffer = this.fillVerticesBufferAndReturnBuffer(vertices_data);
        const t_write_buffer = this.fillTexCoordsBufferAndReturnBuffer(texcoords_data);

        // encode a command
        const command_encoder = this.m_ctx.device.createCommandEncoder();
        command_encoder.copyBufferToBuffer(v_write_buffer, 0, this.m_verticesBuffer, 0, this.m_verticesBuffer.size);
        command_encoder.copyBufferToBuffer(t_write_buffer, 0, this.m_texCoordsBuffer, 0, this.m_texCoordsBuffer.size);
        this.m_ctx.device.queue.submit([command_encoder.finish()]);

        v_write_buffer.mapAsync(GPUMapMode.WRITE)
            .then(() => this.m_verticesStagingBuffers.push(v_write_buffer));
        t_write_buffer.mapAsync(GPUMapMode.WRITE)
            .then(() => this.m_texCoordsStagingBuffers.push(t_write_buffer));
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
     * Draw the element.
     */
    public draw (): void 
    {
        // 6 indices , 1 instance
        this.m_ctx.currentRenderPassEncoder.drawIndexed(6, 1);
    }
}