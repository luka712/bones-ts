/**
 * @brief The component type.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants
 */
export enum ComponentType
{
    /**
     * If NONE, try to automatically select size from data provided.
     */
    NONE = 0,
    
    BYTE = 0x1400,
    UNSIGNED_BYTE = 0x1401,
    SHORT = 0x1402,
    UNSIGNED_SHORT = 0x1403,
    INT = 0x1404,
    UNSIGNED_INT = 0x1405,
    FLOAT = 0x1406
};

/**
 * The buffer usage hint.
 */
export enum BufferUsage
{
    STATIC_DRAW = 0x88E4,
    DYNAMIC_DRAW = 0x88E8,
    STREAM_DRAW = 0x88E0
};

// see https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants

/**
 * The draw type.
 */
export enum DrawType 
{
    /**
     * Passed to drawElements or drawArrays to draw single points.
     */
    POINTS = 0x0000,

      /**
     * Passed to drawElements or drawArrays to draw lines. Each set of two vertices creates a separate line.
     */
    LINES= 0x0001,

    /**
     * Passed to drawElements or drawArrays to draw triangles. Each set of three vertices creates a separate triangle.
     */
    TRIANGLES = 0x0004,

    /**
     * A Triangle Strip consists of connected triangles. It is defined by a sequence of vertices for the triangles, with each group of three consecutive vertices describing a triangle.
     */
    TRIANGLE_STRIP =  0x0004,  

    /**
     * Passed to drawElements or drawArrays to draw a connected group of triangles. Each vertex connects to the previous and the first vertex in the fan.
     */
    TRIANGLE_FAN = 0x0006
}

export class IndicesBufferDescription
{
    constructor()
    {
        this.bufferUsage = BufferUsage.STATIC_DRAW;
    }

    /**
     * Array of bytes, shorts, integers... Whole numbers.
     */
    data: ArrayBuffer;

    /**
     * Type of component.
     */
    componentType: ComponentType;

    /**
     * Count of elements in array to pass.
     */
    count: number;

    /**
     * @The draw type hint, such as STATIC or DYNAMIC
     * In OpenGL this corresponds to GL_STATIC_DRAW or GL_DYNAMIC_DRAW
     */
    bufferUsage: BufferUsage;

    /**
     * The default draw type.
     */
    drawType?: DrawType;
}

export class VertexBufferDescription
{
    constructor()
    {
        this.bufferUsage = BufferUsage.STATIC_DRAW;
    }

    /**
     * If represents position attribute.
     */
    isPositionBuffer: boolean = false;

    /**
     * Layout location, the address of attribute in shader.
     * For example (layout = 0) vec4 a_position
     */
    layoutLocation: number;

    /**
     * Size of vertex, if for example vec2, size would be 2. For vec3 size would be 3.
     */
    vertexSize: number;

    /**
     * Type of component.
     */
    componentType: ComponentType;

    /**
     * The data to pass.
     */
    data: ArrayBuffer;

    /**
     * Triangles to draw. Used only if index buffer is not defined.
     */
    count: number;

    /**
     * The draw type hint, such as STATIC or DYNAMIC
     * In OpenGL this corresponds to GL_STATIC_DRAW or GL_DYNAMIC_DRAW
     */
     bufferUsage: BufferUsage;

     /**
      * The default draw type. If IndicesBufferDescription is specified, draw type is used from there instead.
      */
     drawType?: DrawType;
}

export class SharedVertexBufferItemDescription
{
    /**
     * @brief Layout location, the address of attribute in shader.
     * For example (layout = 0)vec4 a_position.
     */
    layoutLocation: number;

    /**
     * Size of vertex, if for example vec2, size would be 2. For vec3 size would be 3.
     */
    vertexSize: number;

    /**
     * The type of component, such BYTE, FLOAT etc..
     */
    componentType: ComponentType;

    /**
     * @brief The offset size in bytes. If data is shared, Offset is set from previous item.
     * For example struct of vec3 for position, and vec2 for tex_coords.
     * If calcing tex_coords then offset should be vec3 * sizeof(float).
     *
     */
    offsetInBytes: number;
};

export class SharedVertexBufferDescription
{
    /**
     * @brief Total number of primitives to draw.
     */
    numberOfPrimitives: number;

    /**
     * @brief The data to pass.
     */
    data: ArrayBuffer;

    /**
     * @brief The draw type hint, such as STATIC or DYNAMIC
     * In OpenGL this corresponds to GL_STATIC_DRAW or GL_DYNAMIC_DRAW
     */
     bufferUsage: BufferUsage;

    /**
     * Items description.
     */
    sharedVertexBufferItems: Array<SharedVertexBufferItemDescription>;

    /**
     * The default draw type.
     */        
    drawType: DrawType = DrawType.TRIANGLES;

    /**
     * Used in rare cases where buffer is already allocated in advance. For example when 2 or geometry objects are needed,
     * but share same buffer. Usually leave it empty.
     */
    glBuffer?: WebGLBuffer;
};

/**
 * @brief The geometry buffer, which is just a class for whatever presents geometry.
 * For OpenGL it might be collection of buffers or vertex array object.
 */
export interface GeometryBuffer
{
    /**
     * @brief Bind the current geometry.
     * @param { T|undefined} bind_params - parameters for binding. Implementation needs to know how to interpret it. 
     * For WebGL2 nothing is passed, for WebGPU pass_encoder is passed.
     * @returns { void }
     */
    bind<T> (bind_params?: T): void;

    /**
     * @brief Binds a buffer under index.
     * Index is index of created buffer, so whichever buffer was passed in and internally created.
     * 
     * @param buffer_index for example 0 for first buffer in array of buffers.
     */
    bindBuffer (buffer_index: number): void;

    /**
     * @brief Add new data to a buffer.
     * 
     * @param { ArrayBufferView } buffer_data - new buffer data.
     * @param { number } size - size of data.
     */
    bufferSubData (buffer_data: ArrayBufferView, size: number): void;

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
    transformFeedback(write_into_buffer: GeometryBuffer, n_of_primitves?: number, draw_type?: DrawType);

    /**
     * Deletes the buffer 
     * @returns { void }
     */
    delete (): void;

    /**
     * @brief Draw using the current geometry.
     * @param { T|undefined} bind_params - parameters for binding. Implementation needs to know how to interpret it. 
     * For WebGL2 nothing is passed, for WebGPU pass_encoder is passed.
     * @returns { void }
     */
    draw<T>(draw_params?: T): void;
};
