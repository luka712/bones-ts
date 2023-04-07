
import { WebGPURendererContext } from "../../../../webgpu/WebGPURenderer";
import { Framework } from "../../../Framework";
import { Color } from "../../../math/Color";
import { RectangleRenderer } from "../../RectangleRenderer";
import { Camera2D } from "../../common/Camera2D";
import { GLRectangleRoundedCorner } from "../../gl/rectangle/corner/GLRectangleRoundedCorner";
import { WebGPURectangleRendererPart, WebGPURectangleUtil } from "./WebGPURectangleUtil";
import { WebGPURectangleRoundedCorner } from "./corner/WebGPURectangleRoundedCorner";

// HOW IT WORKS
// it renders a quad
// quad triangles are renderer same for each instance
// the rest of data, such as point a positon, point b position, weight and color is set per instance



// Rect will be created from 5 rectangles + 4 triangle fans for radius of each corner.
// Smaller rectangles are boundaries made from rounded edges + inner rect


export class WebGPURectangleRenderer extends RectangleRenderer
{

    // WebGPU allocated data.
    // we keep multiple buffers, in order to reuse buffers, otherwise new buffer would have to be created each frame.
    private m_stagingBuffers: Array<GPUBuffer> = []; // the staging data buffers, use them to write data into them, and to copy from staging buffer to main buffer.


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


    /**
    * Set the texture coords data.
    * @param data 
    */
    public writeDataIntoBuffer (part: WebGPURectangleRendererPart): void 
    {
        // Get necessary data.
        const attributeBuffer = part.attributesBuffer;
        const attributeData = part.attributesData;

        // 1.try find one write buffer
        let writeBuffer = this.m_stagingBuffers.pop();

        // 2. if it does not exist, create one
        if (!writeBuffer)
        {
            writeBuffer = this.m_ctx.device.createBuffer({
                size: attributeBuffer.size,
                usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC,
                mappedAtCreation: true,
            });
        }

        // 3. write data into staging buffer.
        const array = new Float32Array(writeBuffer.getMappedRange());
        array.set(attributeData);
        writeBuffer.unmap();

        // 4. encode a command
        const command_encoder = this.m_ctx.device.createCommandEncoder();
        // 4 vertices per rect + 2 for positions * 5 for 5
        command_encoder.copyBufferToBuffer(writeBuffer, 0, attributeBuffer, 0, attributeBuffer.size);
        this.m_ctx.device.queue.submit([command_encoder.finish()]);

        writeBuffer.mapAsync(GPUMapMode.WRITE).then(() => this.m_stagingBuffers.push(writeBuffer));
    }


    public async initialize (): Promise<void> 
    {
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

        // cameras 
        const attributeBuffer = part.attributesBuffer;
        const indicesBuffer = part.indicesBuffer;


        // camera matrices need only to change when texture is changed, since new pipeline is used.
        const projectionViewMat = Camera2D.projectionViewMatrix;

        // use this pipeline
        renderPass.setPipeline(pipeline);

        // write global
        // buffer is of size 64 for 1 projection/View matrix of 64 (mat4x4)
        device.queue.writeBuffer(part.projectionViewUniformBuffer, 0, projectionViewMat.buffer, projectionViewMat.byteOffset, projectionViewMat.byteLength);

        // write instance
        device.queue.writeBuffer(part.colorUniformBuffer, 0, color.buffer, color.byteOffset, color.byteLength);

        // buffer subdata attributes
        this.writeDataIntoBuffer(part);

        // set bind groups
        renderPass.setBindGroup(0, part.projectionViewBindGroup);
        renderPass.setBindGroup(1, part.colorBindGroup);

        // set vertex bind group
        renderPass.setIndexBuffer(indicesBuffer, "uint16");
        renderPass.setVertexBuffer(0, attributeBuffer);

        renderPass.drawIndexed(30, 1, 0,0);
    }




    /**
     * Draws the left sub-rect of a rectangle
     */
    private drawLeftRect (x: number, y: number, h: number, tlr: number, blr: number)
    {
        const d = this.m_drawParts[this.m_drawIndex].attributesData;

        // must draw a longer radius for x positions. since rect is drawn from top left clock wise
        const x_rad = Math.max(tlr, blr);

        // a top left
        d[0] = x;       // x
        d[1] = y + tlr; // y + r

        // b top right
        d[2] = x + x_rad; // x + r
        d[3] = d[1];    // y + r

        // c bottom right
        d[4] = d[2];       // x
        d[5] = y + h - blr; // y + h - r

        // d bottom left
        d[6] = x;     // x
        d[7] = d[5];  // y + h - r
    }

    /**
     * Draws the top sub-rect of a rectangle
     */
    private drawTopRect (x: number, y: number, w: number, tlr: number, trr: number)
    {
        const d = this.m_drawParts[this.m_drawIndex].attributesData;

        // must draw a longer radius for x positions. since rect is drawn from top left clock wise
        const y_rad = Math.max(tlr, trr);

        // a top left
        d[8] = x + tlr; // x + r
        d[9] = y; // y

        // b top right
        d[10] = x + w - trr; // x + w - r
        d[11] = y;           // y 

        // c bottom right
        d[12] = d[10];     // x + w - r 
        d[13] = y + y_rad; // y + r

        // d bottom left
        d[14] = d[8];     // x + r
        d[15] = d[13];  // y + r
    }

    /**
     * Draws the right sub-rect of a rectangle
     */
    private drawRightRect (x: number, y: number, w: number, h: number, trr: number, brr: number)
    {
        const d = this.m_drawParts[this.m_drawIndex].attributesData;

        // must draw a longer radius for x positions. since rect is drawn from top left clock wise
        const x_rad = Math.max(brr, trr);

        // a top left
        d[16] = x + w - x_rad; // x + w - r
        d[17] = y + trr; // y + r

        // b top right
        d[18] = x + w; // x + w 
        d[19] = d[17];    // y + r

        // c bottom right
        d[20] = d[18];     // x + w  
        d[21] = y + h - brr; // y + h - r

        // d bottom left
        d[22] = d[16];     // x + w - r
        d[23] = d[21];  // y + h - r
    }

    /**
     * Draws the bottom sub-rect of a rectangle
     */
    private drawBottomRect (x: number, y: number, w: number, h: number, brr: number, blr: number)
    {
        const d = this.m_drawParts[this.m_drawIndex].attributesData;

        // must draw a longer radius for x positions. since rect is drawn from top left clock wise
        const y_rad = Math.max(brr, blr);

        // a top left
        d[24] = x + blr; // x + r
        d[25] = y + h - y_rad; // y + h - r

        // b top right
        d[26] = x + w - brr;    // x + w - r 
        d[27] = d[25];    // y + h - r

        // c bottom right
        d[28] = d[26];     // x + w - r  
        d[29] = y + h; // y + h

        // d bottom left
        d[30] = d[24];     // x + r
        d[31] = d[29];  // y + h
    }

    /**
     * Draws the inner rect of a rectangle.
     */
    private drawInnerRect (x: number, y: number, w: number, h: number, tl: number, tr: number, br: number, bl: number)
    {
        const d = this.m_drawParts[this.m_drawIndex].attributesData;

        // top left 
        d[32] = x + tl;
        d[33] = y + tl;

        // top right
        d[34] = x + w - tr;
        d[35] = y + tr;

        // bottom right
        d[36] = x + w - br;
        d[37] = y + h - br;

        // already defined by c point of left rect
        d[38] = x + bl;
        d[39] = y + h - bl;
    }

    private drawInner (
        x: number, y: number, w: number, h: number,
        color: Color,
        tl: number, tr: number, br: number, bl: number): void 
    {
        if (this.m_drawIndex >= this.m_drawParts.length)
        {
            this.m_drawParts.push(WebGPURectangleUtil.createRectangleRenderPart(this.m_ctx.device));
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