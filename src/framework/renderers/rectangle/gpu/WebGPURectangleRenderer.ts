import { WebGPURendererContext } from "../../../../webgpu/WebGPURenderer";
import { Framework } from "../../../Framework";
import { Color } from "../../../math/Color";
import { RectangleRenderer } from "../../RectangleRenderer";
import { RectangleInstanceData } from "../common/RectangleInstanceData";
import { WebGPURectangleRendererPart, WebGPURectangleRendererUtil } from "./WebGPURectangleRendererUtil";
import { WebGPURectangleRoundedCorner } from "./corner/WebGPURectangleRoundedCorner";

// Rect will be created from 5 rectangles + 4 triangle fans for radius of each corner.
// Smaller rectangles are boundaries made from rounded edges + inner rect

export class WebGPURectangleRenderer extends RectangleRenderer
{
    // #region Properties (7)

    /**
     * The corners renderer
     */
    private m_corners: WebGPURectangleRoundedCorner;
    /**
     * Used to know how many objects are being drawn in current frame.
     */
    private m_drawIndex = 0;
    /**
     * The draw parts.
     */
    private m_drawParts: Array<WebGPURectangleRendererPart> = [];
    private m_instanceData = new RectangleInstanceData();
    // logic for data per instance, position and size for 5 rects

    /**
     * The indices buffer.
     */
    private m_vertexBuffer: GPUBuffer;
    /**
     * The corners.
     */
    // private m_corners: GLRectangleRoundedCorner;

    // default
    private o_color = Color.white();
    private o_strokeColor = Color.black();

    // #endregion Properties (7)

    // #region Constructors (1)

    constructor(framework: Framework, private m_ctx: WebGPURendererContext)
    {
        super();

        m_ctx.onDrawEnd(() =>
        {
            this.m_drawIndex = 0;
        })

        this.m_corners = new WebGPURectangleRoundedCorner(framework, m_ctx);
    }

    // #endregion Constructors (1)

    // #region Public Methods (3)

    /**
     * @inheritdoc
     */
    public draw (
        x: number, y: number, w: number, h: number,
        color?: Color,
        tl: number = 0, tr: number = 0, br: number = 0, bl: number = 0): void 
    {
        color = color ?? this.o_color;

        if (this.m_drawIndex >= this.m_drawParts.length)
        {
            this.m_drawParts.push(WebGPURectangleRendererUtil.createRectangleRenderPart(this.m_ctx.device));
        }

        // rects
        this.m_instanceData.fillInstance(x, y, w, h, tl, tr, br, bl);
        this.gpuDraw(color);

        this.m_drawIndex++;

        this.m_corners.draw(x, y, w, h, tl, tr, br, bl, color);
    }

    /**
     * @inheritdoc
     */
    public drawWithStroke (x: number, y: number, w: number, h: number,
        color?: Color, stroke_width: number = 2, stroke_color?: Color,
        tl: number = 0, tr: number = 0, br: number = 0, bl: number = 0)
    {
        this.draw(
            x, y, w, h,
            stroke_color ?? this.o_strokeColor,
            tl, tr, br, bl);

        this.draw(
            x + stroke_width, y + stroke_width, w - stroke_width * 2, h - stroke_width * 2,
            color ?? this.o_color,
            tl, tr, br, bl);
    }

    public async initialize (): Promise<void> 
    {
        const vertices = [
            0, 1, // v1
            1, 1, // v2
            1, 0, // v3
            0, 1, // v1
            1, 0, // v3
            0, 0  // v4
        ];

        this.m_vertexBuffer = this.m_ctx.device.createBuffer({
            label: "rectangle vertex buffer",
            size: (Float32Array.BYTES_PER_ELEMENT * vertices.length + 3) & ~3,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        });
        const writeIndicesArray = new Float32Array(this.m_vertexBuffer.getMappedRange());
        writeIndicesArray.set(vertices);
        this.m_vertexBuffer.unmap();

        await this.m_corners.initialize();
    }

    // #endregion Public Methods (3)

    // #region Private Methods (1)

    /**
    * Call gl to draw. 
    */
    private gpuDraw (color: Color): void 
    {
        const part = this.m_drawParts[this.m_drawIndex];

        const renderPass = this.m_ctx.currentRenderPassEncoder;
        const device = this.m_ctx.device;

        // extrude parts for simplicity, use raw gpu call
        const pipeline = part.pipeline;

        // use this pipeline
        renderPass.setPipeline(pipeline);

        // write instance
        const data = this.m_instanceData.data;
        device.queue.writeBuffer(part.colorUniformBuffer, 0, color.buffer, color.byteOffset, color.byteLength);
        device.queue.writeBuffer(part.instanceStorageBuffer, 0, data.buffer, 0, data.byteLength);

        // set bind groups
        renderPass.setBindGroup(0, part.projectionViewBindGroup);
        renderPass.setBindGroup(1, part.instanceViewBindGroup);
        renderPass.setBindGroup(2, part.colorBindGroup);

        // set vertex bind group
        renderPass.setVertexBuffer(0, this.m_vertexBuffer);

        renderPass.draw(6, 5, 0, 0);
    }

    // #endregion Private Methods (1)
} 