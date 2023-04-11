// HOW IT WORKS
// it renders a quad
// quad triangles are renderer same for each instance
// the rest of data, such as point a positon, point b position, weight and color is set per instance

import { Color, Vec2 } from "../../../../bones_math";
import { WebGPURectangleRoundedCornerRendererPart, WebGPURectangleRoundedCornerUtil } from "./WebGPURectangleRoundedCornerUtil";
import { Framework } from "../../../../Framework";
import { WebGPURendererContext } from "../../../../../webgpu/WebGPURenderer";

/** SUMMARY  */
// Here triangles are drawn for corner edges of rectangle.
// We draw 4 rounded corners of given resolution. This is done by creating multiple triangles smaller triangles for a corner
// Better way would be with triangle-fan, but webgpu does not support triangle fans yet.

const RESOLUTION = 10;
// step for each triangle.
const STEP = (Math.PI * .5) / (RESOLUTION - 2);

// points vec2 a, vec2 b
export const GL_LINE_RENDERER_STRIDE = 4 * Float32Array.BYTES_PER_ELEMENT;

export class WebGPURectangleRoundedCorner
{
    // #region Properties (4)

    /**
     * Used to know how many objects are being drawn in current frame.
     */
    private m_drawIndex = 0;
    /**
     * Holds WebGPU data for instance data (radius, angle offset, position), color, pipeline etc...
     */
    private m_drawParts: Array<WebGPURectangleRoundedCornerRendererPart> = [];
    /**
     * We draw 4 instances with data being 4 bytes pos2,angleOffsetf32 and radiusf32
     */
    private m_instanceData = new Float32Array(16);
    // private 
    /**
     * Triangles geometry.
     */
    private m_vertexBuffer :GPUBuffer;

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(framework: Framework, private m_ctx: WebGPURendererContext)
    {
        m_ctx.onDrawEnd(() =>
        {
            this.m_drawIndex = 0;
        })
    }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public draw (
        x: number, y: number, w: number, h: number,
        tl: number, tr: number, br: number, bl: number,
        color: Color): void 
    {
        if (this.m_drawIndex >= this.m_drawParts.length)
        {
            this.m_drawParts.push(WebGPURectangleRoundedCornerUtil.createRectangleRoundedCornerRenderPart(this.m_ctx.device));
        }

        // rects
        // TOP LEFT
        this.m_instanceData[0] = x + tl;
        this.m_instanceData[1] = y + tl;
        this.m_instanceData[2] = tl;
        this.m_instanceData[3] = Math.PI;

        // TOP RIGHT 
        this.m_instanceData[4] = x + w - tr;
        this.m_instanceData[5] = y + tr;
        this.m_instanceData[6] = tr;
        this.m_instanceData[7] = Math.PI * 1.5;

        // BOTTOM RIGHT 
        this.m_instanceData[8] = x + w - br;
        this.m_instanceData[9] = y + h - br;
        this.m_instanceData[10] = br;
        this.m_instanceData[11] = 0;

        // BOTTOM LEFT 
        this.m_instanceData[12] = x + bl;
        this.m_instanceData[13] = y + h - bl;
        this.m_instanceData[14] = bl;
        this.m_instanceData[15] = Math.PI * .5;

        const part = this.m_drawParts[this.m_drawIndex];
        const renderPass = this.m_ctx.currentRenderPassEncoder;
        const device = this.m_ctx.device;
        
        // use this pipeline
        renderPass.setPipeline(part.pipeline);

        // camera buffer is already written in main renderer.
        device.queue.writeBuffer(part.instanceStorageBuffer, 0, this.m_instanceData, 0, this.m_instanceData.length);
        device.queue.writeBuffer(part.colorUniformBuffer, 0, color.buffer, color.byteOffset, color.byteLength);

        // set bind groups
        renderPass.setBindGroup(0, part.projectionViewBindGroup);
        renderPass.setBindGroup(1, part.instanceViewBindGroup);
        renderPass.setBindGroup(2, part.colorBindGroup);

        renderPass.setVertexBuffer(0, this.m_vertexBuffer);

        renderPass.draw(27, 4, 0, 0);

        this.m_drawIndex++;
    }

    /**
     * @inheritdoc
     */
    public async initialize (): Promise<void> 
    {
        const d = [];
        const v = Vec2.zero();

        // must be counter clockwise 
        let a = 0;
        for (let i = 0; i < RESOLUTION - 1; i++)
        {
            // always to 0
            d.push(0);
            d.push(0);

            Vec2.fromPolar(a, 1,v);
            d.push(v[0]);
            d.push(v[1]);

            // must be counter clockwise 
            a += STEP;

            Vec2.fromPolar(a, 1, v);
            d.push(v[0]);
            d.push(v[1]);
        }

        this.m_vertexBuffer = this.m_ctx.device.createBuffer({
            label: "rectangle corner position buffer",
            size: (d.length * Float32Array.BYTES_PER_ELEMENT + 3) & ~3,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        });
        const writeIndicesArray = new Float32Array(this.m_vertexBuffer.getMappedRange());
        writeIndicesArray.set(d);
        this.m_vertexBuffer.unmap();
    }

    // #endregion Public Methods (2)
} 