

// HOW IT WORKS
// it renders a quad
// quad triangles are renderer same for each instance
// the rest of data, such as point a positon, point b position, weight and color is set per instance

import { Color } from "../../../../bones_math";
import { Camera2D } from "../../../common/Camera2D";
import { WebGPURectangleRoundedCornerRendererPart, WebGPURectangleRoundedCornerUtil } from "./WebGPURectangleRoundedCornerUtil";
import { Framework } from "../../../../Framework";
import { WebGPURendererContext } from "../../../../../webgpu/WebGPURenderer";




// points vec2 a, vec2 b
export const GL_LINE_RENDERER_STRIDE = 4 * Float32Array.BYTES_PER_ELEMENT;

export class WebGPURectangleRoundedCorner
{
    // private 
    private m_drawParts: Array<WebGPURectangleRoundedCornerRendererPart> = [];

    /**
     * Used to know how many objects are being drawn in current frame.
     */
    private m_drawIndex = 0;

    private m_instanceData = new Float32Array(16);

    constructor(framework: Framework, private m_ctx: WebGPURendererContext)
    {
        m_ctx.onDrawEnd(() =>
        {
            this.m_drawIndex = 0;
        })
    }

    /**
     * @inheritdoc
     */
    public async initialize (): Promise<void> 
    {
    }

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

        renderPass.setVertexBuffer(0, part.vertexBuffer);

        renderPass.draw(27, 4, 0, 0);

        this.m_drawIndex++;
    }
} 