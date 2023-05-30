import { threadId } from "worker_threads";
import { WebGPURendererContext } from "../../../../webgpu/WebGPURenderer";
import { WebGPUTexture2D } from "../../../../webgpu/textures/WebGPUTexture";
import { SpriteRenderer, BlendMode } from "../../../SpriteRenderer";
import { LifecycleState } from "../../../bones_common";
import { Color, Vec2, Rect } from "../../../bones_math";
import { Texture2D } from "../../../bones_texture";
import { SpriteFont } from "../../../fonts/SpriteFont";
import { GPU_SPRITE_RENDERER_ATTRIBUTES_STRIDE, WebGPUSpriteRendererPart, WebGPUSpriteUtil } from "./WebGPUSpriteUtil";

//************* WORKS AS FOLLOWS ***********************/
// create staging buffers 
// create part pipeline ( here each part pipeline will be pipeline, buffers, layouts ) per texture 
// so for each texture there will be pipeline
// when drawing, use whole pipeline.

export class WebGPUSpriteRenderer extends SpriteRenderer
{
    // #region Properties (12)

    /**
     * Keep track of last part, to be able to see if new parts needs to be added.
     */
    private _lastPart?: WebGPUSpriteRendererPart;
    /** 
     * The max number of instances to be drawn per material/texture unit.
     */
    private _maxInstances: number;
    private m_currentBlendMode = BlendMode.AlphaBlending;
    /** 
     * Draw parts are parts that will be drawn and cleared in the end.
     * Cleared when begin/end is called.
     * 
     * Cache is made of blend mode and then texture.
     */
    private m_drawParts: { [id: number]: { [id: string]: WebGPUSpriteRendererPart } } = {};
    // the staging data buffers, use them to write data into them, and to copy from staging buffer to main buffer.
    // WebGPU allocated data.
    // we keep multiple buffers, in order to reuse buffers, otherwise new buffer would have to be created each frame.
    private m_stagingBuffers: Array<GPUBuffer> = [];
    // tint color for optimization.
    private o_defaultTintColor: Color = Color.white();
    private o_rotOrigin: Vec2 = Vec2.zero();
    // Optimization vector, when passing to buffer.
    private o_v0: Vec2 = Vec2.zero();
    private o_v1: Vec2 = Vec2.zero();
    private o_v2: Vec2 = Vec2.zero();
    private o_v3: Vec2 = Vec2.zero();

    // #endregion Properties (12)

    // #region Constructors (1)

    constructor(private m_ctx: WebGPURendererContext)
    {
        super();
    }

    // #endregion Constructors (1)

    // #region Public Methods (9)

    /**
     * {@inheritDoc SpriteRenderer}
     */
    public begin (mode?: BlendMode, maxInstances: number = 1000): void
    {
        this.m_currentBlendMode = mode ?? BlendMode.AlphaBlending;

        this._lastPart = null;

        // important, webgpu allocates buffer per each texture, which is size of stride * maxInstances
        // if you expect large number of entities, increase max instances to allocate in single buffer.
        // for small number of entities, smaller buffer can be used, to optimize size of buffer.
        this._maxInstances = maxInstances;
    }

    /**
     * @brief Destroy the sprite batch manager.
     */
    public destroy (): void
    {
        // TODO: destroy resources.
    }

    /**
     * {@inheritDoc SpriteRenderer}
     */
    public draw (texture: Texture2D, draw_rect: Rect, tintColor: Color, rotation_in_radians?: number, rotation_anchor?: Vec2): void
    {
        this.handleTexture(texture as WebGPUTexture2D);

        const i = this._lastPart.instanceIndex * GPU_SPRITE_RENDERER_ATTRIBUTES_STRIDE;

        // draw inner fills buffer correctly with positions, texture coordinates, tint color and increase the current instance index.
        this.drawInner(i, draw_rect.x, draw_rect.y, draw_rect.w, draw_rect.h, rotation_in_radians, rotation_anchor, tintColor);
    }

    /**
     * @inheritdoc
     */
    public drawOnPosition (texture: Texture2D, position: Vec2, tintColor?: Color, rotation_in_radians?: number, rotation_anchor?: Vec2, scale_factor?: Vec2): void
    {
        this.handleTexture(texture as WebGPUTexture2D);

        let i = this._lastPart.instanceIndex * GPU_SPRITE_RENDERER_ATTRIBUTES_STRIDE;

        // /******************* SETUP OPTIMIZATION VECTORS ******************/
        // it's easier to reason with vector.
        // TODO: use first with passed
        // const origin = origin ?? this.origin;
        const origin = this.origin;

        // move to top left by default
        const x = position[0] - origin.x * texture.width;
        const y = position[1] - origin.y * texture.height;

        let w = texture.width;
        let h = texture.height;

        if (scale_factor)
        {
            w *= scale_factor[0];
            h *= scale_factor[1];
        }

        // draw inner fills buffer correctly with positions, texture coordinates, tint color and increase the current instance index.
        this.drawInner(i, x, y, w, h, rotation_in_radians, rotation_anchor, tintColor);
    }

    /**
     * @inheritdoc
     */
    public drawSource (texture: Texture2D, drawRect: Rect, sourceRect: Rect, tintColor?: Color, rotationInRadians?: number, rotationAnchor?: Vec2): void
    {
        this.handleTexture(texture as WebGPUTexture2D);

        // find current index, but take into account stride.
        const i = this._lastPart.instanceIndex * GPU_SPRITE_RENDERER_ATTRIBUTES_STRIDE;

        // draw inner fills buffer correctly with positions, texture coordinates, tint color and increase the current instance index.
        this.drawInnerSource(
            i,
            drawRect.x, drawRect.y, drawRect.w, drawRect.h,
            sourceRect,
            rotationInRadians, rotationAnchor, tintColor);
    }

    /**
    * @inheritdoc
    */
    public drawString (font: SpriteFont, text: string, position: Vec2, tintColor?: Color, scale: number = 1): void
    {
        this.handleTexture(font.texture as WebGPUTexture2D);

        let i = this._lastPart.instanceIndex * GPU_SPRITE_RENDERER_ATTRIBUTES_STRIDE;

        const d = this._lastPart.attributesData;

        let x = Math.floor(position[0]);
        let y = Math.floor(position[1]);

        // iterate through all characters
        const l = text.length;
        for (let j = 0; j < l; j++)
        {
            i = this._lastPart.instanceIndex * GPU_SPRITE_RENDERER_ATTRIBUTES_STRIDE;

            const c = text[j];
            const ch = font.getFontCharacterInfo(c);

            let _x = x;
            let _y = y;

            const w = Math.floor(ch.size[0] * scale);
            const h = Math.floor(ch.size[1] * scale);

            const texelsQuad = ch.textureCoords;

            // -0.5, -0.5, 0, 0, 0,			// bottom left corner
            // v0
            d[i] = _x;
            d[i + 1] = _y;
            d[i + 2] = 0;
            // tc0
            d[i + 3] = texelsQuad.a[0];
            d[i + 4] = texelsQuad.a[1];
            // color0
            d[i + 5] = tintColor.r;
            d[i + 6] = tintColor.g;
            d[i + 7] = tintColor.b;
            d[i + 8] = tintColor.a;

            // -0.5, 0.5, 0, 0, 1,			// top left corner
            // v1
            d[i + 9] = _x;
            d[i + 10] = _y + h;
            d[i + 11] = 0;
            // tc1
            d[i + 12] = texelsQuad.b[0];
            d[i + 13] = texelsQuad.b[1];
            // color1
            d[i + 14] = tintColor.r;
            d[i + 15] = tintColor.g;
            d[i + 16] = tintColor.b;
            d[i + 17] = tintColor.a;

            // 0.5, 0.5, 0, 1, 1,			// top right corner
            // v2
            d[i + 18] = _x + w;
            d[i + 19] = _y + h;
            d[i + 20] = 0;
            // tc2
            d[i + 21] = texelsQuad.c[0];
            d[i + 22] = texelsQuad.c[1];
            // color2
            d[i + 23] = tintColor.r;
            d[i + 24] = tintColor.g;
            d[i + 25] = tintColor.b;
            d[i + 26] = tintColor.a;

            // 0.5, -0.5, 0, 1, 0			// bottom right corner
            // v3
            d[i + 27] = _x + w;
            d[i + 28] = _y;
            d[i + 29] = 0;
            // tc3
            d[i + 30] = texelsQuad.d[0];
            d[i + 31] = texelsQuad.d[1];
            // color3
            d[i + 32] = tintColor.r;
            d[i + 33] = tintColor.g;
            d[i + 34] = tintColor.b;
            d[i + 35] = tintColor.a;

            this._lastPart.instanceIndex++;
            x += Math.floor(ch.advance[0] * scale);
        }
    }

    /**
     * @brief End the sprite rendering.
     */
    public end (): void
    {
        // for each in draw parts
        for (const blendPart in this.m_drawParts)
        {
            for (const key in this.m_drawParts[blendPart])
            {
                const part = this.m_drawParts[blendPart][key];

                // if there is anything to draw, draw it and reset index.
                if (part.instanceIndex > 0)
                {
                    this.gpuDraw(part);
                    part.instanceIndex = 0;
                }
            }
        }
    }

    /**
     * @brief Initialize the sprite batch manager. Initialize must be called in order to properly initialize all the variables.
     */
    public async initialize (): Promise<void>
    {
        this.m_state = LifecycleState.Initialized;
    }

    /**
     * Set the texture coords data.
     * @param data 
     */
    public writeDataIntoBuffer (part: WebGPUSpriteRendererPart): void 
    {
        // Get necessary data.
        const attributeBuffer = part.attributesBuffer;
        const attributeData = part.attributesData;
        const instanceIndex = part.instanceIndex;

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
        // 5 for number of vertexes
        command_encoder.copyBufferToBuffer(writeBuffer, 0, attributeBuffer, 0, (instanceIndex + 1) * GPU_SPRITE_RENDERER_ATTRIBUTES_STRIDE * 4);
        this.m_ctx.device.queue.submit([command_encoder.finish()]);

        writeBuffer.mapAsync(GPUMapMode.WRITE).then(() => this.m_stagingBuffers.push(writeBuffer));
    }

    // #endregion Public Methods (9)

    // #region Private Methods (5)

    /**
     * Draw inner is just helper function to lower code reuse. Increases the current index on each draw.
     * @param i - pass here index multiplied by stride: this.m_currentInstanceIndex * STRIDE
     * @param x - the x position
     * @param y - the y position
     * @param w - the sprite width
     * @param h - the sprite height
     * @param rotation_in_radians - rotation theta
     * @param rotation_anchor - rotation anchor
     * @param tintColor - tint color
     */
    private drawInner (i: number, x: number, y: number, w: number, h: number,
        rotation_in_radians: number, rotation_anchor?: Vec2, tintColor?: Color): void
    {
        const d = this._lastPart.attributesData;

        // bottom left corner
        this.o_v0[0] = x;
        this.o_v0[1] = y;

        // top left corner
        this.o_v1[0] = x;
        this.o_v1[1] = y + h;

        // top right corner
        this.o_v2[0] = x + w;
        this.o_v2[1] = y + h;

        // bottom right corner.
        this.o_v3[0] = x + w;
        this.o_v3[1] = y;

        // rotate 
        if (rotation_in_radians)
        {
            // TOP LEFT CORNER BY DEFAULT.
            this.o_rotOrigin[0] = x + w * this.rotationAnchor[0];
            this.o_rotOrigin[1] = y + h * this.rotationAnchor[1];

            // correct of origin is present.
            if (rotation_anchor)
            {
                this.o_rotOrigin[0] += w * rotation_anchor[0];
                this.o_rotOrigin[1] += h * rotation_anchor[1];
            }

            this.o_v0.rotateAroundPoint(this.o_rotOrigin, rotation_in_radians);
            this.o_v1.rotateAroundPoint(this.o_rotOrigin, rotation_in_radians);
            this.o_v2.rotateAroundPoint(this.o_rotOrigin, rotation_in_radians);
            this.o_v3.rotateAroundPoint(this.o_rotOrigin, rotation_in_radians);
        }

        // use default if not set.
        tintColor = tintColor ?? this.o_defaultTintColor;

        // -0.5, -0.5, 0, 0, 0,			// bottom left corner
        // v0
        d[i] = this.o_v0[0];
        d[i + 1] = this.o_v0[1];
        d[i + 2] = 0;
        // tc0
        d[i + 3] = 0;
        d[i + 4] = 0;
        // color0
        d[i + 5] = tintColor.r;
        d[i + 6] = tintColor.g;
        d[i + 7] = tintColor.b;
        d[i + 8] = tintColor.a;

        // -0.5, 0.5, 0, 0, 1,			// top left corner
        // v1
        d[i + 9] = this.o_v1[0];
        d[i + 10] = this.o_v1[1];
        d[i + 11] = 0;
        // tc1
        d[i + 12] = 0;
        d[i + 13] = 1;
        // color1
        d[i + 14] = tintColor.r;
        d[i + 15] = tintColor.g;
        d[i + 16] = tintColor.b;
        d[i + 17] = tintColor.a;

        // 0.5, 0.5, 0, 1, 1,			// top right corner
        // v2
        d[i + 18] = this.o_v2[0];
        d[i + 19] = this.o_v2[1];
        d[i + 20] = 0;
        // tc2
        d[i + 21] = 1;
        d[i + 22] = 1;
        // color2
        d[i + 23] = tintColor.r;
        d[i + 24] = tintColor.g;
        d[i + 25] = tintColor.b;
        d[i + 26] = tintColor.a;

        // 0.5, -0.5, 0, 1, 0			// bottom right corner
        // v3
        d[i + 27] = this.o_v3[0];
        d[i + 28] = this.o_v3[1];
        d[i + 29] = 0;
        // tc3
        d[i + 30] = 1;
        d[i + 31] = 0;
        // color3
        d[i + 32] = tintColor.r;
        d[i + 33] = tintColor.g;
        d[i + 34] = tintColor.b;
        d[i + 35] = tintColor.a;

        this._lastPart.instanceIndex++;
    }

    /**
     * Draw inner is just helper function to lower code bloat. Increases the current index on each draw.
     * @param i - pass here index multiplied by stride: this.m_currentInstanceIndex * STRIDE
     * @param x - the x position
     * @param y - the y position
     * @param w - the sprite width
     * @param h - the sprite height
     * @param sourceRect - the source rectangle.
     * @param rotation_in_radians - rotation theta
     * @param rotation_anchor - rotation anchor
     * @param tintColor - tint color
     */
    private drawInnerSource (i: number,
        x: number, y: number, w: number, h: number,
        sourceRect: Rect,
        rotation_in_radians: number, rotation_anchor?: Vec2, tintColor?: Color): void
    {
        const d = this._lastPart.attributesData;
        const texture = this._lastPart.texture;

        // bottom left corner
        this.o_v0[0] = x;
        this.o_v0[1] = y;

        // top left corner
        this.o_v1[0] = x;
        this.o_v1[1] = y + h;

        // top right corner
        this.o_v2[0] = x + w;
        this.o_v2[1] = y + h;

        // bottom right corner.
        this.o_v3[0] = x + w;
        this.o_v3[1] = y;

        // rotate 
        if (rotation_in_radians)
        {
            // TOP LEFT CORNER BY DEFAULT.
            this.o_rotOrigin[0] = x + w * this.rotationAnchor[0];
            this.o_rotOrigin[1] = y + h * this.rotationAnchor[1];

            // correct of origin is present.
            if (rotation_anchor)
            {
                this.o_rotOrigin[0] += w * rotation_anchor[0];
                this.o_rotOrigin[1] += h * rotation_anchor[1];
            }

            this.o_v0.rotateAroundPoint(this.o_rotOrigin, rotation_in_radians);
            this.o_v1.rotateAroundPoint(this.o_rotOrigin, rotation_in_radians);
            this.o_v2.rotateAroundPoint(this.o_rotOrigin, rotation_in_radians);
            this.o_v3.rotateAroundPoint(this.o_rotOrigin, rotation_in_radians);
        }

        // use default if not set.
        tintColor = tintColor ?? this.o_defaultTintColor;

        const tx = sourceRect.x / texture.width;
        const ty = sourceRect.y / texture.height;

        const tx2 = tx + (sourceRect.w / texture.width);
        const ty2 = ty + (sourceRect.h / texture.height);

        // -0.5, -0.5, 0, 0, 0,			// bottom left corner
        // v0
        d[i] = this.o_v0[0];
        d[i + 1] = this.o_v0[1];
        d[i + 2] = 0;
        // tc0
        d[i + 3] = tx;
        d[i + 4] = ty2;
        // color0
        d[i + 5] = tintColor.r;
        d[i + 6] = tintColor.g;
        d[i + 7] = tintColor.b;
        d[i + 8] = tintColor.a;

        // -0.5, 0.5, 0, 0, 1,			// top left corner
        // v1
        d[i + 9] = this.o_v1[0];
        d[i + 10] = this.o_v1[1];
        d[i + 11] = 0;
        // tc1
        d[i + 12] = tx;
        d[i + 13] = ty;
        // color1
        d[i + 14] = tintColor.r;
        d[i + 15] = tintColor.g;
        d[i + 16] = tintColor.b;
        d[i + 17] = tintColor.a;

        // 0.5, 0.5, 0, 1, 1,			// top right corner
        // v2
        d[i + 18] = this.o_v2[0];
        d[i + 19] = this.o_v2[1];
        d[i + 20] = 0;
        // tc2
        d[i + 21] = tx2;
        d[i + 22] = ty;
        // color2
        d[i + 23] = tintColor.r;
        d[i + 24] = tintColor.g;
        d[i + 25] = tintColor.b;
        d[i + 26] = tintColor.a;

        // 0.5, -0.5, 0, 1, 0			// bottom right corner
        // v3
        d[i + 27] = this.o_v3[0];
        d[i + 28] = this.o_v3[1];
        d[i + 29] = 0;
        // tc3
        d[i + 30] = tx2;
        d[i + 31] = ty2;
        // color3
        d[i + 32] = tintColor.r;
        d[i + 33] = tintColor.g;
        d[i + 34] = tintColor.b;
        d[i + 35] = tintColor.a;

        this._lastPart.instanceIndex++;
    }

    /**
     * Get sprite render part for texture.
     * @param texture 
     */
    private getSpriteRenderPart (texture: WebGPUTexture2D): WebGPUSpriteRendererPart
    {
        const id = texture.id;

        let blendCache = this.m_drawParts[this.m_currentBlendMode];
        if (!blendCache)
        {
            blendCache = {};
            this.m_drawParts[this.m_currentBlendMode] = blendCache;
        }

        let part = this.m_drawParts[this.m_currentBlendMode][id];
        if (!part)
        {
           part = WebGPUSpriteUtil.createSpriteRenderPart(this.m_ctx.device,
                texture,
                this._maxInstances,
                this.m_currentBlendMode);
            this.m_drawParts[this.m_currentBlendMode][id] = part;
        }

        return part;
    }

    /**
     * Call to gpu draw.
     * Here setup use pipeline, which was created when texture was changed,
     * write into buffers and bind everything.
     */
    private gpuDraw (part: WebGPUSpriteRendererPart): void 
    {
        const renderPass = this.m_ctx.currentRenderPassEncoder;
        const device = this.m_ctx.device;

        // extrude parts for simplicity, use raw gpu call
        const pipeline = part.pipeline;

        // cameras 
        const globalBindGroup = part.globalBindGroup;

        const textureBindGroup = part.textureBindGroup;
        const attributeBuffer = part.attributesBuffer;
        const indicesBuffer = part.indicesBuffer;

        const instanceIndex = part.instanceIndex;

        // use this pipeline
        renderPass.setPipeline(pipeline);

        // buffer subdata attributes
        this.writeDataIntoBuffer(part);

        // set bind groups
        renderPass.setBindGroup(0, globalBindGroup);
        renderPass.setBindGroup(1, textureBindGroup);

        // set vertex bind group
        renderPass.setIndexBuffer(indicesBuffer, "uint32");
        renderPass.setVertexBuffer(0, attributeBuffer);

        // draw, num of indices, num of instances.
        renderPass.drawIndexed(instanceIndex * 6);
    }

    /**
     * Handles the texture and changes it to current if neccessary.
     * If texture is change, current instnace is reset to 0.
     * Also sets texture to shader
     * .
     * @param texture 
     */
    private handleTexture (texture: WebGPUTexture2D): void 
    {
        if (texture != this._lastPart?.texture)
        {
            // custom defined pipeline part
            this._lastPart = this.getSpriteRenderPart(texture);
        }
    }

    // #endregion Private Methods (5)
}
