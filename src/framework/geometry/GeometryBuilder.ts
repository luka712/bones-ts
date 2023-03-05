import { QuadGeometry } from "./bones_geometry";
import { Geometry } from "./Geometry";

export class GeometryBuilder 
{
    public buildCubeGeometry () 
    {
        const vertices = new Float32Array(
            [
                // front
                -0.5, -0.5, 0.5,
                0.5, -0.5, 0.5,
                0.5, 0.5, 0.5,
                -0.5, 0.5, 0.5,
                // back
                -0.5, -0.5, -0.5,
                0.5, -0.5, -0.5,
                0.5, 0.5, -0.5,
                -0.5, 0.5, -0.5
            ]
        );

        const faceColors = [
            [1.0, 1.0, 1.0, 1.0], // Front face: white
            [1.0, 0.0, 0.0, 1.0], // Back face: red
            [0.0, 1.0, 0.0, 1.0], // Top face: green
            [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
            [1.0, 1.0, 0.0, 1.0], // Right face: yellow
            [1.0, 0.0, 1.0, 1.0], // Left face: purple
        ];

        // Convert the array of colors into a table for all the vertices.

        var colors = [];

        for (var j = 0; j < faceColors.length; ++j)
        {
            const c = faceColors[j];
            // Repeat each color four times for the four vertices of the face
            colors = colors.concat(c, c, c, c);
        }

        const vertexColors = new Float32Array([
            1,1,1,1,
            1,0,0,1,
            0,1,0,1,
            0,0,1,1,
            1,1,0,1,
            1,0,1,1,
            0,1,1,1,
            0,0,0,1
        ]);

        const indices = new Uint32Array([
            // front
            0, 1, 2,
            2, 3, 0,
            // right
            1, 5, 6,
            6, 2, 1,
            // back
            7, 6, 5,
            5, 4, 7,
            // left
            4, 0, 3,
            3, 7, 4,
            // bottom
            4, 5, 1,
            1, 0, 4,
            // top
            3, 2, 6,
            6, 7, 3
        ]);

        const geometry = new Geometry();

        geometry.vertexPositions = vertices;
        geometry.indices = indices;
        geometry.vertexColors = vertexColors;

        return geometry;
    }

    public buildQuadGeometry (): Geometry 
    {
        const vertices = new Float32Array([
            -0.5, -0.5, 0, // bottom left corner
            -0.5, 0.5, 0,  // top left corner
            0.5, 0.5, 0,   // top right corner
            0.5, -0.5, 0 // bottom right corner
        ]);


        const indices = new Uint16Array([
            0, 1, 2,  // first triangle (bottom left - top left - top right)
            0, 2, 3 // second triangle (bottom left - top right - bottom right))
        ]);


        const textureCoords = new Float32Array([
            0.0, 0.0,
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
        ]);


        const sharedVerticesTextureCoords = new Float32Array([
            -0.5, -0.5, 0, 0, 0,			// bottom left corner
            -0.5, 0.5, 0, 0, 1,			// top left corner
            0.5, 0.5, 0, 1, 1,			// top right corner
            0.5, -0.5, 0, 1, 0			// bottom right corner
        ]);

        const quadGeomery = new Geometry();

        quadGeomery.vertexPositions = vertices;
        quadGeomery.indices = indices;
        return quadGeomery;
    }
}