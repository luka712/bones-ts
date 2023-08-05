import { WebGPURendererContext } from "../../../../webgpu/WebGPURenderer";
import { WebGPUTexture2D } from "../../../../webgpu/textures/WebGPUTexture";
import { SpriteRenderer, BlendMode } from "../../../SpriteRenderer";
import { LifecycleState } from "../../../bones_common";
import { Color, Vec2, Rect } from "../../../bones_math";
import { Texture2D } from "../../../bones_texture";
import { BufferUtil } from "../../../buffer/BufferUtil";
import { SpriteFont } from "../../../fonts/SpriteFont";
import { GPU_SPRITE_RENDERER_ATTRIBUTES_STRIDE, SpritePipeline } from "./SpritePipeline";
import { SpriptePipelineConstants } from "./SpritePipelineConstants";

//************* WORKS AS FOLLOWS ***********************/
// create staging buffers 
// create part pipeline ( here each part pipeline will be pipeline, buffers, layouts ) per texture 
// so for each texture there will be pipeline
// when drawing, use whole pipeline.

export class WebGPUSpriteRenderer extends SpriteRenderer {
    // #region Properties (12)

    private m_currentBlendMode = BlendMode.AlphaBlending;
    private m_currentPipeline: SpritePipeline | undefined;
    private m_currentTexture: Texture2D | undefined;
    private m_indexBuffer: GPUBuffer;
    /** 
     * Draw parts are parts that will be drawn and cleared in the end.
     * Cleared when begin/end is called.
     * 
     * Cache is made of blend mode and then texture.
     */
    private m_spritePipelineCache: { [id: number]: { [id: string]: Array<SpritePipeline> } } = {};
    // The collection of buffers which are used for drawing. 
    // If there is buffer pop one from stack, otherwise create one and push it to stack at draw end.
    private m_vertexBufferStack: Array<GPUBuffer> = [];
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

    constructor(private m_ctx: WebGPURendererContext) {
        super();
    }

    // #endregion Constructors (1)

    // #region Public Methods (10)

    /**
     * {@inheritDoc SpriteRenderer}
     */
    public begin (mode?: BlendMode): void {
        this.m_currentBlendMode = mode ?? BlendMode.AlphaBlending;
    }

    public beginFrame () {
        // restart the pipeline cache.
        this.m_spritePipelineCache = {};
    }

    /**
     * @brief Destroy the sprite batch manager.
     */
    public destroy (): void {
        // TODO: destroy resources.
    }

    /**
     * {@inheritDoc SpriteRenderer}
     */
    public draw (texture: Texture2D, draw_rect: Rect, tintColor: Color, rotation_in_radians?: number, rotation_anchor?: Vec2): void {
        const pipeline = this.getOrCreatePipeline(this.m_currentBlendMode, texture as WebGPUTexture2D);

        // draw inner fills buffer correctly with positions, texture coordinates, tint color and increase the current instance index.
        this.drawInner(pipeline, draw_rect.x, draw_rect.y, draw_rect.w, draw_rect.h, rotation_in_radians, rotation_anchor, tintColor);
    }

    /**
     * @inheritdoc
     */
    public drawOnPosition (texture: Texture2D, position: Vec2, tintColor?: Color, rotation_in_radians?: number, rotation_anchor?: Vec2, scale_factor?: Vec2): void {
        const pipeline = this.getOrCreatePipeline(this.m_currentBlendMode, texture as WebGPUTexture2D);

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

        if (scale_factor) {
            w *= scale_factor[0];
            h *= scale_factor[1];
        }

        // draw inner fills buffer correctly with positions, texture coordinates, tint color and increase the current instance index.
        this.drawInner(pipeline, x, y, w, h, rotation_in_radians, rotation_anchor, tintColor);
    }

    /**
     * @inheritdoc
     */
    public drawSource (texture: Texture2D, drawRect: Rect, sourceRect: Rect, tintColor?: Color, rotationInRadians?: number, rotationAnchor?: Vec2): void {
        const pipeline = this.getOrCreatePipeline(this.m_currentBlendMode, texture as WebGPUTexture2D);

        // draw inner fills buffer correctly with positions, texture coordinates, tint color and increase the current instance index.
        this.drawInnerSource(
            pipeline,
            drawRect.x, drawRect.y, drawRect.w, drawRect.h,
            sourceRect,
            rotationInRadians, rotationAnchor, tintColor);
    }

    /**
    * @inheritdoc
    */
    public drawString (font: SpriteFont, text: string, position: Vec2, tintColor?: Color, scale: number = 1): void {
        const pipeline = this.getOrCreatePipeline(this.m_currentBlendMode, font.texture as WebGPUTexture2D);

        let i = pipeline.instanceIndex * GPU_SPRITE_RENDERER_ATTRIBUTES_STRIDE;

        const d = pipeline.dataArray;

        let x = Math.floor(position[0]);
        let y = Math.floor(position[1]);

        // iterate through all characters
        const l = text.length;
        for (let j = 0; j < l; j++) {
            i = pipeline.instanceIndex * GPU_SPRITE_RENDERER_ATTRIBUTES_STRIDE;

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

            pipeline.instanceIndex++;
            x += Math.floor(ch.advance[0] * scale);
        }
    }

    /**
     * @brief End the sprite rendering.
     */
    public end (): void {
        this.m_currentBlendMode = BlendMode.AdditiveBlending;
    }

    /**
     * Call it on end of frame.
     */
    public endFrame () {
        const renderPass = this.m_ctx.currentRenderPassEncoder;
        const device = this.m_ctx.device;

        // temprary used buffers. At end assign to buffer stack.
        const tempBuffers: Array<GPUBuffer> = [];

        // go through each blend mode
        for (const blendMode in this.m_spritePipelineCache) {
            // go through each texture
            const perBlendMode = this.m_spritePipelineCache[blendMode];
            for (const texKey in perBlendMode) {
                const perTexture = perBlendMode[texKey];

                // go through each pipeline
                for (const spritePipeline of perTexture) {
                    const pipeline = spritePipeline.pipeline;
                    const dataArray = spritePipeline.dataArray;
                    const instance = spritePipeline.instanceIndex;
                    const globalBindGroup = spritePipeline.globalBindGroup;
                    const textureBindGroup = spritePipeline.textureBindGroup;

                    let vertexBuffer = this.m_vertexBufferStack.pop();
                    if (!vertexBuffer) {
                        vertexBuffer = BufferUtil.createEmptyVertexBuffer(device, dataArray.byteLength);
                    }

                    tempBuffers.push(vertexBuffer);

                    device.queue.writeBuffer(vertexBuffer, 0, dataArray, 0, instance * SpriptePipelineConstants.BYTES_PER_INSTANCE);

                    // use this pipeline
                    renderPass.setPipeline(pipeline);

                    // set bind groups
                    renderPass.setBindGroup(0, globalBindGroup);
                    renderPass.setBindGroup(1, textureBindGroup);

                    // set vertex bind group
                    renderPass.setIndexBuffer(this.m_indexBuffer, "uint16");
                    renderPass.setVertexBuffer(0, vertexBuffer);

                    // draw, num of indices, num of instances.
                    renderPass.drawIndexed(spritePipeline.instanceIndex * 6);
                }
            }
        }
    }

    /**
     * @brief Initialize the sprite batch manager. Initialize must be called in order to properly initialize all the variables.
     */
    public async initialize (): Promise<void> {
        this.m_state = LifecycleState.Initialized;

        this.setupIndexBuffer();
    }

    // #endregion Public Methods (10)

    // #region Private Methods (4)

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
    private drawInner (spritePipeline: SpritePipeline, x: number, y: number, w: number, h: number,
        rotation_in_radians: number, rotation_anchor?: Vec2, tintColor?: Color): void {
        const d = spritePipeline.dataArray;

        let i = spritePipeline.instanceIndex * SpriptePipelineConstants.FLOATS_PER_INSTANCE;

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
        if (rotation_in_radians) {
            // TOP LEFT CORNER BY DEFAULT.
            this.o_rotOrigin[0] = x + w * this.rotationAnchor[0];
            this.o_rotOrigin[1] = y + h * this.rotationAnchor[1];

            // correct of origin is present.
            if (rotation_anchor) {
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

        spritePipeline.instanceIndex++;
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
    private drawInnerSource (spritePipeline: SpritePipeline,
        x: number, y: number, w: number, h: number,
        sourceRect: Rect,
        rotation_in_radians: number, rotation_anchor?: Vec2, tintColor?: Color): void {
        const d = spritePipeline.dataArray;
        const texture = this.m_currentTexture;
        const i = spritePipeline.instanceIndex * SpriptePipelineConstants.FLOATS_PER_INSTANCE;

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
        if (rotation_in_radians) {
            // TOP LEFT CORNER BY DEFAULT.
            this.o_rotOrigin[0] = x + w * this.rotationAnchor[0];
            this.o_rotOrigin[1] = y + h * this.rotationAnchor[1];

            // correct of origin is present.
            if (rotation_anchor) {
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

        spritePipeline.instanceIndex++;
    }

    /**
     * Gets or creates the pipeline. Takes care of pushint it to cache.
     * @param blendMode - The blend mode to use. Also used as key for cache.
     * @param texture - The texture to use. Also used as key for cache.
     * @returns {SpriptePipeline}
     */
    private getOrCreatePipeline (blendMode: BlendMode, texture: WebGPUTexture2D): SpritePipeline {
        this.m_currentTexture = texture;

        // if there is no pipeline for this blend mode, create one.
        let texDict = this.m_spritePipelineCache[blendMode];
        if (!texDict) {
            texDict = {};
            this.m_spritePipelineCache[blendMode] = texDict;
        }

        // if there is no pipeline for this texture, create one.
        let pipelineArray = this.m_spritePipelineCache[blendMode][texture.id];
        if (!pipelineArray) {
            pipelineArray = [];
            texDict[texture.id] = pipelineArray;
        }

        // if there is no pipeline, create one.
        let pipeline = pipelineArray[pipelineArray.length - 1];
        if (!pipeline) {
            pipeline = SpritePipeline.create(this.m_ctx.device, texture, blendMode);
            pipelineArray.push(pipeline);
        }

        // if the pipeline is full, create a new one.
        if (pipeline.instanceIndex >= SpriptePipelineConstants.MAX_INSTANCES) {
            // if the pipeline is full, create a new one.
            pipeline = SpritePipeline.create(this.m_ctx.device, texture, blendMode);
            pipelineArray.push(pipeline);
        }

        return pipeline;
    }

    /**
     * Setsup index buffer.
     */
    private setupIndexBuffer (): void {
        // index of indice
        const indexData = new Uint16Array(SpriptePipelineConstants.MAX_INSTANCES * 6);
        let index = 0;
        for (let i = 0; i < SpriptePipelineConstants.MAX_INSTANCES * 6; i += 6) {
            // Should be something like
            // 0, 1, 2, first triangle (bottom left - top left - top right)
            // 0, 2, 3  second triangle (bottom left - top right - bottom right))

            // first triangle
            indexData[i] = index;
            indexData[i + 1] = index + 1;
            indexData[i + 2] = index + 2;

            // second triangle
            indexData[i + 3] = index;
            indexData[i + 4] = index + 2;
            indexData[i + 5] = index + 3;

            index += 4;
        }

        this.m_indexBuffer = BufferUtil.createIndexBuffer(this.m_ctx.device, indexData);
    }

    // #endregion Private Methods (4)
}
