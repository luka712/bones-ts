import { WebGPURenderer } from "../../../webgpu/WebGPURenderer";
import { Framework } from "../../Framework";
import { Geometry } from "../../geometry/Geometry";
import { Mesh } from "../Mesh";


export class WebGPUMesh extends Mesh
{
  
    public indicesBuffer: GPUBuffer;
    public indexFormat: GPUIndexFormat;
    

    public vertexPositionsBuffer: GPUBuffer;
    public vertexColorsBuffer: GPUBuffer;

    private m_device : GPUDevice;
    private m_numOfVertices = 0;
    

    constructor(private m_framework: Framework, private m_geometry: Geometry) 
    {
        super();
        this.m_numOfVertices = m_geometry.vertexPositions.length / 3;
        this.indicesCount = m_geometry.indices.length;
    }

    /**
     * Creates and maps to buffer for indices.
     */
    private initializeIndicesBuffer (): GPUBuffer
    {
        const indicesBuffer = this.m_device.createBuffer({
            label: "indexBuffer",
            size: this.m_geometry.indices.byteLength,
            usage: GPUBufferUsage.INDEX,
            mappedAtCreation: true
        });
        // TODO: handle Uint16Array 
        const writeIndicesArray = new Uint16Array(indicesBuffer.getMappedRange());
        this.indexFormat = "uint16";
        writeIndicesArray.set(this.m_geometry.indices);
        indicesBuffer.unmap();

        return indicesBuffer;

    }

    private intitializePositionsBuffer (): GPUBuffer
    {
        const device = (this.m_framework.renderer as WebGPURenderer).device;


        // POSITIONS, TEX COORDS, TINT COLORS
        const positionsBuffer = device.createBuffer({
            label: "vertex_position_buffer",
            size: this.m_geometry.vertexPositions.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        });

        // write data to buffer.
        const writeDatArray = new Float32Array(positionsBuffer.getMappedRange());
        writeDatArray.set(this.m_geometry.vertexPositions);
        positionsBuffer.unmap();

        return positionsBuffer;
    }

    private intitializeColorsBuffer (): GPUBuffer
    {
        const device = this.m_device;

        let vertexColors = this.m_geometry.vertexColors;
        if (!vertexColors || vertexColors.length == 0)
        {
            // if it's not available, initialize to white
            vertexColors = new Float32Array(this.m_numOfVertices * 4);
            for (let i = 0; i < this.m_numOfVertices * 4; i++)
            {
                vertexColors[i] = 1;
            }
        }


        // POSITIONS, TEX COORDS, TINT COLORS
        const colorsBuffer = device.createBuffer({
            label: "vertexBuffer",
            size: vertexColors.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        });

        // write data to buffer.
        const writeDatArray = new Float32Array(colorsBuffer.getMappedRange());
        writeDatArray.set(vertexColors);
        colorsBuffer.unmap();

        return colorsBuffer;
    }


    public initialize () : void 
    {
        this.m_device = (this.m_framework.renderer as WebGPURenderer).device;

        this.indicesBuffer = this.initializeIndicesBuffer();
        this.vertexPositionsBuffer = this.intitializePositionsBuffer();
        this.vertexColorsBuffer = this.intitializeColorsBuffer();
    }

    public destroy () : void 
    {
        throw new Error("Method not implemented.");
    }
}