import { GeometryBuffer, ComponentType, IndicesBufferDescription, SharedVertexBufferDescription, VertexBufferDescription, DrawType } from "../../GeometryBuffer";

export interface GLGeometryBufferOptions 
{
    // #region Properties (2)

    /**
     * Should use instanced drawing ?
     */
    instanced?: boolean;
    /**
     * The number of instances.
     */
    instancesCount?: number;

    // #endregion Properties (2)
}

/**
 * The GLVao. Or geometry buffer. Holds information about geometry.
 */
export class GLGeometryBuffer implements GeometryBuffer
{
    // #region Properties (11)

    private __deleted: boolean = false;
    private m_arrayBufferIds: Array<WebGLBuffer>;
    /**
     * The draw type.
     */
    private m_drawType: DrawType;
    private m_indexBufferId: WebGLBuffer;
    /**
     * The number of indices. Used when indexed buffer is used. Used with drawElements.
     */
    private m_indicesCount: number = 0;
    private m_indicesType: ComponentType;
    /**
     * If instanced drawing is used, this is number of instances.
     */
    private m_instancesCount = 0;
    /**
     * The number of primitives to draw. Used when no index buffer is used. Used with drawArrays
     */
    private m_primitiveCount: number = 0;
    /**
     * @brief The id of VAO.
     */
    private m_vaoId: WebGLVertexArrayObject;

    /**
     * The buffer or main buffer, there can be muliple buffers, if there are multiple, this is bound to position buffer 
     * or first buffer.
     */
    public buffer: WebGLBuffer;
    /**
     * Should use instanced drawing ?
     */
    public instancedDraw: boolean = false;

    // #endregion Properties (11)

    // #region Constructors (1)

    /**
     * The constructor.
     * @param { WebGL2RenderingContext } m_gl 
     * @param { Array<SharedVertexBufferDescription> } vertices_attr - pass null if shared vertex buffer description is used.
     * @param { IndicesBufferDescription } indices_attr - indices attributes, pass null if there aren't any
     * @param { SharedVertexBufferDescription } shared_buffer - pass if it's type of shared buffer.
     */
    constructor(private m_gl: WebGL2RenderingContext,
        vertices_attr: Array<VertexBufferDescription> = null,
        indices_attr: IndicesBufferDescription = null,
        shared_buffer: SharedVertexBufferDescription = null,
        options: GLGeometryBufferOptions = {})
    {
        const gl = this.m_gl;

        this.m_arrayBufferIds = [];
        this.m_indexBufferId = 0;
        this.instancedDraw = !!options.instanced;
        this.m_instancesCount = options.instancesCount ?? 0;
 
        this.m_vaoId = gl.createVertexArray();
        this.bind();

        // there is no shared buffer.

        // handle indices if any
        if (indices_attr)
        {
            this.handleIndicesBuffer(indices_attr);
        }

        if (vertices_attr)
        {
            for (let attr of vertices_attr)
            {
                const id = gl.createBuffer();

                gl.bindBuffer(gl.ARRAY_BUFFER, id);
                gl.bufferData(gl.ARRAY_BUFFER, attr.data, attr.bufferUsage);

                this.m_gl.vertexAttribPointer(attr.layoutLocation, attr.vertexSize, attr.componentType, false, 0, 0);

                // when instanced drawing is used. 
                if (attr.divisor > 0)
                {
                    gl.vertexAttribDivisor(attr.layoutLocation, attr.divisor);
                }
                this.m_gl.enableVertexAttribArray(attr.layoutLocation);

                if (attr.isPositionBuffer)
                {
                    this.buffer = id;
                    if (!this.m_drawType)
                    {
                        this.m_drawType = attr.drawType;
                    }
                }

                this.m_arrayBufferIds.push(id);
            }
        }

        if (shared_buffer)
        {
            this.validateSharedBuffer(shared_buffer);

            // if there are indices, handle them
            if (indices_attr)
            {
                this.handleIndicesBuffer(indices_attr);
            }

            // usually needs to be created, but in rare instances can be provided.
            this.buffer = shared_buffer.glBuffer;

            // most of time shared buffer won't be assigned, and will be created. 
            // but in rare instances it might be used, such as when sharing buffer between multiple geoemtry definitions.
            if (!this.buffer)
            {
                this.buffer = this.m_gl.createBuffer();
                this.m_gl.bindBuffer(this.m_gl.ARRAY_BUFFER, this.buffer);
                this.m_gl.bufferData(this.m_gl.ARRAY_BUFFER, shared_buffer.data, shared_buffer.bufferUsage);
            }
            else 
            {
                // else just bind already assigned buffer.
                this.m_gl.bindBuffer(this.m_gl.ARRAY_BUFFER, this.buffer);
            }
            this.m_arrayBufferIds.push(this.buffer);

            var stride = 0;

            for (let attr of shared_buffer.sharedVertexBufferItems)
            {
                var size = this.resolveTypeSize(attr.componentType);

                // For example float * vec2
                stride += size * attr.vertexSize;
            }

            for (let attr of shared_buffer.sharedVertexBufferItems)
            {
                this.m_gl.vertexAttribPointer(attr.layoutLocation, attr.vertexSize, attr.componentType, false, stride, attr.offsetInBytes);
                this.m_gl.enableVertexAttribArray(attr.layoutLocation);
            }

            // setup other vars.
            this.m_drawType = shared_buffer.drawType;
            this.m_primitiveCount = shared_buffer.numberOfPrimitives;
        }

        this.unbind();
        // unbind buffer as well, only needs to be called once
        this.m_gl.bindBuffer(this.m_gl.ARRAY_BUFFER, null);

        this.m_drawType = this.m_drawType ?? DrawType.TRIANGLES;
    }

    // #endregion Constructors (1)

    // #region Public Methods (7)

    /**
     * @brief Bind the current VAO.
     *
     */
    public bind (): void 
    {
        this.m_gl.bindVertexArray(this.m_vaoId);
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
        this.m_gl.bindBuffer(this.m_gl.ARRAY_BUFFER, this.m_arrayBufferIds[buffer_index]);
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
        this.m_gl.bufferSubData(this.m_gl.ARRAY_BUFFER, 0, buffer_data);
    }

    /**
     * @brief Delete the VAO and buffers.
     * @returns { void }
     */
    public delete (): void 
    {
        if (!this.__deleted)
        {
            this.m_gl.deleteVertexArray(this.m_vaoId);
            for (let id of this.m_arrayBufferIds)
            {
                this.m_gl.deleteBuffer(id);
            }

            if (this.m_indexBufferId)
            {
                this.m_gl.deleteBuffer(this.m_indexBufferId);
            }
        }
        this.__deleted = true;
    }

    /**
     * @brief Draw the element using the VAO.
     * @returns { void }
     */
    public draw (): void 
    {
        const gl = this.m_gl;

        if (this.instancedDraw)
        {
            gl.drawArraysInstanced(this.m_drawType, 0, this.m_primitiveCount, this.m_instancesCount);
        }
        else
        {
            if (this.m_indicesCount > 0)
            {
                this.m_gl.drawElements(this.m_drawType, this.m_indicesCount, this.m_indicesType, 0);
            }
            else
            {
                this.m_gl.drawArrays(this.m_drawType, 0, this.m_primitiveCount);
            }
        }
    }

    /**
     * Transform Feedback is the process of capturing Primitives generated by the Vertex Processing step(s), recording data from those primitives into Buffer Objects. 
     * This allows one to preserve the post-transform rendering state of an object and resubmit this data multiple times.
     * 
     * @see https://www.khronos.org/opengl/wiki/Transform_Feedback
     * 
     * In layman terms, moves data from one buffer, to other buffer. 
     * 
     * @param { GeometryBuffer } write_into_buffer - buffer to write into.
     * @param { number | undefined } n_of_primitves - number of primitives to write. If undefined, number of draw instances from read buffer is used for write buffer.
     * @param { DrawType } draw_type - the draw type of buffer. If not set, draw from read type is set for write buffer.
     */
    public transformFeedback (write_into_buffer: GeometryBuffer, n_of_primitves: number = -1, draw_type?: DrawType)
    {
        const write_buffer = write_into_buffer as GLGeometryBuffer;

        // if -1, then use from read buffer.
        if (n_of_primitves < 0)
        {
            n_of_primitves = this.m_primitiveCount;
        }
        if (!draw_type)
        {
            draw_type = this.m_drawType;
        }

        // Bind the "read" buffer.
        this.bind();

        // Bind the "write" buffer as transform feedback - the varyings of the shader will be written here.
        this.m_gl.bindBufferBase(this.m_gl.TRANSFORM_FEEDBACK_BUFFER, 0, write_buffer.buffer);

        // Since we're not actually rendering anything when updating the transform feedback, disable rasterization.
        this.m_gl.enable(this.m_gl.RASTERIZER_DISCARD);

        // Begin transform feedback.
        this.m_gl.beginTransformFeedback(draw_type); // GL_TRIANGLES, GL_POINTS etc... 
        this.m_gl.drawArrays(draw_type, 0, n_of_primitves);
        this.m_gl.endTransformFeedback();
        this.m_gl.flush();
        this.m_gl.disable(this.m_gl.RASTERIZER_DISCARD);

        // Important. Always do this.
        // Unbind the transform feedback buffer!
        this.m_gl.bindBufferBase(this.m_gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    }

    /**
     * @brief Unbind the current VAO.
     *
     */
    public unbind (): void 
    {
        this.m_gl.bindVertexArray(null);
    }

    // #endregion Public Methods (7)

    // #region Private Methods (3)

    /**
     * @brief Create a Indices Buffer object.
     *
     * @param { IndicesBufferDescription } indices_attr
     */
    private handleIndicesBuffer (indices_attr: IndicesBufferDescription)
    {
        this.m_indexBufferId = this.m_gl.createBuffer();
        this.m_gl.bindBuffer(this.m_gl.ELEMENT_ARRAY_BUFFER, this.m_indexBufferId);

        // var size = this.__resolveTypeSize(indices_attr.componentType);
        this.m_gl.bufferData(this.m_gl.ELEMENT_ARRAY_BUFFER, indices_attr.data, indices_attr.bufferUsage);

        this.m_indicesCount = indices_attr.count;
        this.m_indicesType = indices_attr.componentType;
        this.m_drawType = indices_attr.drawType;
    }

    /**
     * @brief Resolve the size for each of types.
     *
     * @param { ComponenType } type type to resolve
     * @return { number } size of type
     */
    private resolveTypeSize (type: ComponentType): number 
    {
        var size = 4;
        if (type == ComponentType.UNSIGNED_BYTE || type == ComponentType.BYTE)
        {
            size = 1;
        }
        else if (type == ComponentType.UNSIGNED_SHORT || type == ComponentType.SHORT)
        {
            size = 2;
        }
        else if (type == ComponentType.FLOAT || type == ComponentType.UNSIGNED_INT || type == ComponentType.INT)
        {
            size = 4;
        }
        else
        {
            var msg = "GLVao::ResolveTypeSize: unknown size!";
            console.error(msg);
        }

        return size;
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

    // #endregion Private Methods (3)
};
