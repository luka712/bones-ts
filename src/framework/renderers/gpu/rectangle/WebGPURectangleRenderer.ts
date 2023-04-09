
import { WebGPURendererContext } from "../../../../webgpu/WebGPURenderer";
import { Framework } from "../../../Framework";
import { Color } from "../../../math/Color";
import { RectangleRenderer } from "../../RectangleRenderer";
import { WebGPURectangleRendererPart, WebGPURectangleRendererUtil } from "./WebGPURectangleRendererUtil";
import { WebGPURectangleRoundedCorner } from "./corner/WebGPURectangleRoundedCorner";


// Rect will be created from 5 rectangles + 4 triangle fans for radius of each corner.
// Smaller rectangles are boundaries made from rounded edges + inner rect


export class WebGPURectangleRenderer extends RectangleRenderer
{
    private m_insanceData = new Float32Array(20);

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

    /**
     * The corners renderer
     */
    private m_corners: WebGPURectangleRoundedCorner;

    /**
     * The draw parts.
     */
    private m_drawParts: Array<WebGPURectangleRendererPart> = [];

    /**
     * Used to know how many objects are being drawn in current frame.
     */
    private m_drawIndex = 0;

    constructor(framework: Framework, private m_ctx: WebGPURendererContext)
    {
        super();

        m_ctx.onDrawEnd(() =>
        {
            this.m_drawIndex = 0;
        })


        this.m_corners = new WebGPURectangleRoundedCorner(framework, m_ctx);
    }

    public async initialize (): Promise<void> 
    {
        const vertices = [
            0,1, // v1
            1,1, // v2
            1,0, // v3
            0,1, // v1
            1,0, // v3
            0,0  // v4
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
        device.queue.writeBuffer(part.colorUniformBuffer, 0, color.buffer, color.byteOffset, color.byteLength);
        device.queue.writeBuffer(part.instanceStorageBuffer, 0, this.m_insanceData.buffer, 0, this.m_insanceData.byteLength);

        // set bind groups
        renderPass.setBindGroup(0, part.projectionViewBindGroup);
        renderPass.setBindGroup(1, part.instanceViewBindGroup);
        renderPass.setBindGroup(2, part.colorBindGroup);

        // set vertex bind group
        renderPass.setVertexBuffer(0, this.m_vertexBuffer);

        renderPass.draw(6, 5, 0,0);
    }




    /**
     * Draws the left sub-rect of a rectangle
     */
    private drawLeftRect (x: number, y: number, h: number, tlr: number, blr: number)
    {
        const d = this.m_insanceData;

        // must draw a longer radius for x positions. since rect is drawn from top left clock wise
        const rw = Math.max(tlr, blr);

        // pos
        d[0] = x;       // x
        d[1] = y + tlr; // y + r

        // size
        d[2] = rw;
        d[3] = h - tlr - blr // h - r - r;
    }

    /**
     * Draws the top sub-rect of a rectangle
     */
    private drawTopRect (x: number, y: number, w: number, tlr: number, trr: number)
    {
        const d = this.m_insanceData;

        // must draw a longer radius for x positions. since rect is drawn from top left clock wise
        const rh = Math.max(tlr, trr);

        // pos 
        d[4] = x + tlr; // x + r
        d[5] = y; // y

        // size 
        d[6] = w - tlr - trr;     // w - r - r
        d[7] = rh;           // h
    }

    /**
     * Draws the right sub-rect of a rectangle
     */
    private drawRightRect (x: number, y: number, w: number, h: number, trr: number, brr: number)
    {
        const d = this.m_insanceData;

        // must draw a longer radius for x positions. since rect is drawn from top left clock wise
        const rw = Math.max(brr, trr);

        // pos
        d[8] = x + w - rw; // x + w - r
        d[9] = y + trr; // y + r

        // size
        d[10] = rw;     // w 
        d[11] = h - trr - brr;  // h - r - r
    }

    /**
     * Draws the bottom sub-rect of a rectangle
     */
    private drawBottomRect (x: number, y: number, w: number, h: number, brr: number, blr: number)
    {
        const d = this.m_insanceData;

        // must draw a longer radius for x positions. since rect is drawn from top left clock wise
        const rh = Math.max(brr, blr);

        // pos
        d[12] = x + blr; // x + r
        d[13] = y + h - rh; // y + h - r

        // size
        d[14] = w - blr - brr; // w - r - r
        d[15] = rh;
    }

    /**
     * Draws the inner rect of a rectangle.
     */
    private drawInnerRect (x: number, y: number, w: number, h: number, tl: number, tr: number, br: number, bl: number)
    {
        const d = this.m_insanceData;

        const mt = Math.min(tl, tr); // min top
        const ml = Math.min(tl, bl); // min left

        // pos 
        d[16] = x + ml
        d[17] = y + mt;

        // size
        d[18] = w - ml - Math.min(br, tr); 
        d[19] = h - mt - Math.min(bl, br);
    }

    private drawInner (
        x: number, y: number, w: number, h: number,
        color: Color,
        tl: number, tr: number, br: number, bl: number): void 
    {
        if (this.m_drawIndex >= this.m_drawParts.length)
        {
            this.m_drawParts.push(WebGPURectangleRendererUtil.createRectangleRenderPart(this.m_ctx.device));
        }

        // rects
        this.drawLeftRect(x, y, h, tl, bl);
        this.drawTopRect(x, y, w, tl, tr);
        this.drawRightRect(x, y, w, h, tr, br);
        this.drawBottomRect(x, y, w, h, br, bl);
        this.drawInnerRect(x, y, w, h, tl, tr, br, bl);
        this.gpuDraw(color);

        this.m_drawIndex++;

        this.m_corners.draw(x, y, w, h, tl, tr, br, bl, color);
    }

  
    /**
     * @inheritdoc
     */
    public draw (
        x: number, y: number, w: number, h: number,
        color?: Color,
        tl: number = 0, tr: number = 0, br: number = 0, bl: number = 0): void 
    {
        this.drawInner(
            x, y, w, h,
            color ?? this.o_color,
            tl, tr, br, bl);
    }

    /**
     * @inheritdoc
     */
    public drawWithStroke (x: number, y: number, w: number, h: number,
        color?: Color, stroke_width: number = 2, stroke_color?: Color,
        tl: number = 0, tr: number = 0, br: number = 0, bl: number = 0)
    {

        this.drawInner(
            x, y, w, h,
            stroke_color ?? this.o_strokeColor,
            tl, tr, br, bl);

        this.drawInner(
            x + stroke_width, y + stroke_width, w - stroke_width * 2, h - stroke_width * 2,
            color ?? this.o_color,
            tl, tr, br, bl);

    }

} 