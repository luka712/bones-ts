
enum IndicesType
{
    U8,
    U16,
    U32,
    U64
};

class Indices
{
};

/**
 * The quad geometry.
 */
class QuadGeometry
{
    constructor()
    {
        this.vertices = new Float32Array([
            -0.5, -0.5, 0, // bottom left corner
            -0.5, 0.5, 0,  // top left corner
            0.5, 0.5, 0,   // top right corner
            0.5, -0.5, 0 // bottom right corner
        ]);
        this.verticesCount = 12;

        this.indices = new Uint16Array([
            0, 1, 2,  // first triangle (bottom left - top left - top right)
            0, 2, 3 // second triangle (bottom left - top right - bottom right))
        ]);
        this.indicesCount = 6;

        this.textureCoords = new Float32Array([
            0.0,0.0,
            0.0,1.0,
            1.0,1.0,
            1.0,0.0,
        ]);
        this.textureCoordsCount = 8;

        this.sharedVerticesTextureCoords = new Float32Array([
            -0.5, -0.5, 0,    0,0,			// bottom left corner
            -0.5, 0.5, 0,  	  0,1,			// top left corner
            0.5, 0.5, 0,	  1,1,			// top right corner
            0.5, -0.5, 0,	  1,0			// bottom right corner
        ]);
        this.sharedVerticesTextureCoordsCount = 20;
    }

    readonly vertices: Float32Array;
    readonly verticesCount: number;

    readonly indices: Uint16Array;
    readonly indicesCount: number;

    readonly textureCoords: Float32Array;
    readonly textureCoordsCount: number;

    /**
     * The shared buffer of vertices positions and texture coordinates.
     */
    readonly sharedVerticesTextureCoords :Float32Array;
    readonly sharedVerticesTextureCoordsCount: number;
};


export 
{
    IndicesType,
    QuadGeometry
}