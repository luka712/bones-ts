

export class Geometry
{
    /**
     * The vertices of geometry.
     */
    vertexPositions: Float32Array;

    /**
     * Indices are always kept as unsigned buffer until requested.
     */
    indices: Uint16Array | Uint32Array;

    /**
     * The vertex colors.
     */
    vertexColors: Float32Array;
};
