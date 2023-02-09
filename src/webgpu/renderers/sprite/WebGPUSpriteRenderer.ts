import { LifecycleState } from "../../../framework/bones_common";
import { Color, Rect } from "../../../framework/bones_math";
import { IRenderer } from "../../../framework/bones_renderer";
import { Texture2D } from "../../../framework/bones_texture";
import { Vec2 } from "../../../framework/math/vec/Vec2";
import { Blend, SpriteRenderer } from "../../../framework/SpriteRenderer";
import { WindowManager } from "../../../framework/Window";
import { WebGPUTexture2D } from "../../textures/WebGPUTexture";
import { WebGPURendererContext } from "../../WebGPURenderer";
import { createSpriteRenderPipeline, STRIDE, WebGPUSpriteRendererPart } from "./WebGPUSpriteUtil";

// in order to optimize, sprite renderer will render with really large buffer that needs to be setup properly
// buffer will support configurable number of instances. If one needs to render, larger number of instance, either configure 
// sprite renderer, or create new instance of it.
const NUM_MAX_INSTANCES = 1000;

//************* WORKS AS FOLLOWS ***********************/
// create staging buffers 
// create part pipeline ( here each part pipeline will be pipeline, buffers, layouts ) per texture 
// so for each texture there will be pipeline
// when drawing, use whole pipeline.

export class WebGPUSpriteRenderer extends SpriteRenderer
{
    // WebGPU allocated data.
    // we keep multiple buffers, in order to reuse buffers, otherwise new buffer would have to be created each frame.
    private m_stagingBuffers: Array<GPUBuffer> = []; // the staging data buffers, use them to write data into them, and to copy from staging buffer to main buffer.

    /**
     * Parts need to be created for each texture.
     * Cache parts per texture.
     */
    private m_parts: { [id: string]: WebGPUSpriteRendererPart } = {};
    private m_currentPart: WebGPUSpriteRendererPart;

    // index of current instance. Must be less then NUM_MAX_INSTANCES
    private m_currentInstanceIndex = 0;
    // the current texure
    private m_currentTexture?: WebGPUTexture2D;

    // tint color for optimization.
    private o_defaultTintColor: Color = Color.white();

    private o_defaultBlend = Blend.nonPremultiplied();

    // Optimization vector, when passing to buffer.
    private o_v0: Vec2 = Vec2.zero();
    private o_v1: Vec2 = Vec2.zero();
    private o_v2: Vec2 = Vec2.zero();
    private o_v3: Vec2 = Vec2.zero();
    private o_rotOrigin: Vec2 = Vec2.zero();

    constructor(private m_ctx: WebGPURendererContext, public readonly window: WindowManager, public readonly renderer: IRenderer)
    {
        super();

        this.window.subscribeToWindowResized((e) => 
        {
            this.resize(e.width, e.height);
        });

        this.resize(window.width, window.height);
    }


    /**
     * Set the texture coords data.
     * @param data 
     */
    public writeDataIntoBuffer (attributeBuffer: GPUBuffer, attributeData: Float32Array): void 
    {
        // 1. get or create staging buffer ( write ) 

        // try find one write buffer
        let writeBuffer = this.m_stagingBuffers.pop();

        // if it does not exist, create one
        if (!writeBuffer)
        {
            writeBuffer = this.m_ctx.device.createBuffer({
                size: attributeBuffer.size,
                usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC,
                mappedAtCreation: true,
            });
        }

        // 2. write data into staging buffer.
        const array = new Float32Array(writeBuffer.getMappedRange());
        array.set(attributeData);
        writeBuffer.unmap();

        // 3. encode a command
        const command_encoder = this.m_ctx.device.createCommandEncoder();
        // 4 for number of vertexes
        command_encoder.copyBufferToBuffer(writeBuffer, 0, attributeBuffer, 0, (this.m_currentInstanceIndex + 1) * STRIDE * 4);
        this.m_ctx.device.queue.submit([command_encoder.finish()]);

        writeBuffer.mapAsync(GPUMapMode.WRITE).then(() => this.m_stagingBuffers.push(writeBuffer));
    }

    /**
     * @brief Initialize the sprite batch manager. Initialize must be called in order to properly initialize all the variables.
     */
    public async initialize (): Promise<void>
    {
        this.m_state = LifecycleState.Initialized;
    }

    /**
     * @brief Destroy the sprite batch manager.
     */
    public destroy (): void
    {
        // TODO: destroy resources.
    }

    /**
     * Called when render pass has begun. For WebGL2 it's not relevant yet. So do nothing.
     * @param { T } data 
     */
    public beginRenderPass<T> (data: T): void
    {
        // do nothing.
    }

    /**
     * Call to gpu draw.
     * Here setup use pipeline, which was created when texture was changed,
     * write into buffers and bind everything.
     */
    private gpuDraw (): void 
    {
        const renderPass = this.m_ctx.currentRenderPassEncoder;
        const device = this.m_ctx.device;

        // extrude parts for simplicity, use raw gpu call
        const pipeline = this.m_currentPart.pipeline;
        const cameraBuffer = this.m_currentPart.cameraUniformBuffer;
        const cameraBindGroup = this.m_currentPart.cameraBindGroup;
        const textureBindGroup = this.m_currentPart.textureBindGroup;
        const attributeBuffer = this.m_currentPart.attributesBuffer;
        const indicesBuffer = this.m_currentPart.indicesBuffer;
        const data = this.m_currentPart.attributesData;

        // camera matrices need only to change when texture is changed, since new pipeline is used.
        const projectionMat = this.m_projectionMatrix;
        const viewMat = this.m_viewMatrix;

        // use this pipeline
        renderPass.setPipeline(pipeline);

        // buffer is of size 128 for 2 matrices of 64 (mat4x4)
        device.queue.writeBuffer(cameraBuffer, 0, projectionMat.buffer, projectionMat.byteOffset, projectionMat.byteLength);
        device.queue.writeBuffer(cameraBuffer, 64, viewMat.buffer, viewMat.byteOffset, viewMat.byteLength);

        // it is at bind group 0
        renderPass.setBindGroup(0, cameraBindGroup);
        renderPass.setBindGroup(1, textureBindGroup);

        // buffer subdata
        this.writeDataIntoBuffer(attributeBuffer, data);

        // set vertex bind group
        renderPass.setIndexBuffer(indicesBuffer, "uint32");
        renderPass.setVertexBuffer(0, attributeBuffer);

        // draw, num of indices, num of instances.
        renderPass.drawIndexed(this.m_currentInstanceIndex * 6);

        // reset index.
        this.m_currentInstanceIndex = 0;
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
        if (texture != this.m_currentTexture)
        {
            // if there is a texture, it must be drawn.
            if (this.m_currentTexture)
            {
                this.gpuDraw();
            }

            // now store in current texture
            this.m_currentTexture = texture;

            // custom defined pipeline part
            this.m_currentPart = this.m_parts[texture.id];

            // if there is no part for this texture, create one
            if (!this.m_currentPart)
            {
                this.m_currentPart = createSpriteRenderPipeline(this.m_ctx.device, texture, NUM_MAX_INSTANCES);
                this.m_parts[texture.id] = this.m_currentPart;
            }
        }
    }

    /**
     * {@inheritDoc SpriteRenderer}
     */
    public begin (mode?: Blend): void
    {
        // reset stuff and instance index.
        this.m_currentTexture = null;
        this.m_currentInstanceIndex = 0;

        // GLBlendModeUtil.setBlendMode(gl, mode ?? this.o_defaultBlend);

    }

    /**
     * Draw inner is just helper function to lower code reuse. Increases the current index on each draw.
     * @param i - pass here index multiplied by stride: this.m_currentInstanceIndex * STRIDE
     * @param x - the x position
     * @param y - the y position
     * @param w - the sprite width
     * @param h - the sprite height
     * @param rotation_in_radians - rotation theta
     * @param rotation_anchor - rotation anchor
     * @param tint_color - tint color
     */
    private drawInner (i: number, x: number, y: number, w: number, h: number,
        rotation_in_radians: number, rotation_anchor?: Vec2, tint_color?: Color): void
    {
        const d = this.m_currentPart.attributesData;

        x += w * .5;
        y += h * .5;

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
        tint_color = tint_color ?? this.o_defaultTintColor;

        // -0.5, -0.5, 0, 0, 0,			// bottom left corner
        // v0
        d[i] = this.o_v0[0];
        d[i + 1] = this.o_v0[1];
        d[i + 2] = 0;
        // tc0
        d[i + 3] = 0;
        d[i + 4] = 0;
        // color0
        d[i + 5] = tint_color.r;
        d[i + 6] = tint_color.g;
        d[i + 7] = tint_color.b;
        d[i + 8] = tint_color.a;

        // -0.5, 0.5, 0, 0, 1,			// top left corner
        // v1
        d[i + 9] = this.o_v1[0];
        d[i + 10] = this.o_v1[1];
        d[i + 11] = 0;
        // tc1
        d[i + 12] = 0;
        d[i + 13] = 1;
        // color1
        d[i + 14] = tint_color.r;
        d[i + 15] = tint_color.g;
        d[i + 16] = tint_color.b;
        d[i + 17] = tint_color.a;

        // 0.5, 0.5, 0, 1, 1,			// top right corner
        // v2
        d[i + 18] = this.o_v2[0];
        d[i + 19] = this.o_v2[1];
        d[i + 20] = 0;
        // tc2
        d[i + 21] = 1;
        d[i + 22] = 1;
        // color2
        d[i + 23] = tint_color.r;
        d[i + 24] = tint_color.g;
        d[i + 25] = tint_color.b;
        d[i + 26] = tint_color.a;

        // 0.5, -0.5, 0, 1, 0			// bottom right corner
        // v3
        d[i + 27] = this.o_v3[0];
        d[i + 28] = this.o_v3[1];
        d[i + 29] = 0;
        // tc3
        d[i + 30] = 1;
        d[i + 31] = 0;
        // color3
        d[i + 32] = tint_color.r;
        d[i + 33] = tint_color.g;
        d[i + 34] = tint_color.b;
        d[i + 35] = tint_color.a;

        this.m_currentInstanceIndex++;
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
     * @param tint_color - tint color
     */
    private drawInnerSource (i: number,
        x: number, y: number, w: number, h: number,
        sourceRect: Rect,
        rotation_in_radians: number, rotation_anchor?: Vec2, tint_color?: Color): void
    {
        const d = this.m_currentPart.attributesData;

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
        tint_color = tint_color ?? this.o_defaultTintColor;

        const tx = sourceRect.x / this.m_currentTexture.width;
        const ty = sourceRect.y / this.m_currentTexture.height;

        const tx2 = tx + (sourceRect.w / this.m_currentTexture.width);
        const ty2 = ty + (sourceRect.h / this.m_currentTexture.height);

        // -0.5, -0.5, 0, 0, 0,			// bottom left corner
        // v0
        d[i] = this.o_v0[0];
        d[i + 1] = this.o_v0[1];
        d[i + 2] = 0;
        // tc0
        d[i + 3] = tx;
        d[i + 4] = ty2;
        // color0
        d[i + 5] = tint_color.r;
        d[i + 6] = tint_color.g;
        d[i + 7] = tint_color.b;
        d[i + 8] = tint_color.a;

        // -0.5, 0.5, 0, 0, 1,			// top left corner
        // v1
        d[i + 9] = this.o_v1[0];
        d[i + 10] = this.o_v1[1];
        d[i + 11] = 0;
        // tc1
        d[i + 12] = tx;
        d[i + 13] = ty;
        // color1
        d[i + 14] = tint_color.r;
        d[i + 15] = tint_color.g;
        d[i + 16] = tint_color.b;
        d[i + 17] = tint_color.a;

        // 0.5, 0.5, 0, 1, 1,			// top right corner
        // v2
        d[i + 18] = this.o_v2[0];
        d[i + 19] = this.o_v2[1];
        d[i + 20] = 0;
        // tc2
        d[i + 21] = tx2;
        d[i + 22] = ty;
        // color2
        d[i + 23] = tint_color.r;
        d[i + 24] = tint_color.g;
        d[i + 25] = tint_color.b;
        d[i + 26] = tint_color.a;

        // 0.5, -0.5, 0, 1, 0			// bottom right corner
        // v3
        d[i + 27] = this.o_v3[0];
        d[i + 28] = this.o_v3[1];
        d[i + 29] = 0;
        // tc3
        d[i + 30] = tx2;
        d[i + 31] = ty2;
        // color3
        d[i + 32] = tint_color.r;
        d[i + 33] = tint_color.g;
        d[i + 34] = tint_color.b;
        d[i + 35] = tint_color.a;

        this.m_currentInstanceIndex++;
    }

    /**
     * {@inheritDoc SpriteRenderer}
     */
    public draw (texture: Texture2D, draw_rect: Rect, tint_color: Color, rotation_in_radians?: number, rotation_anchor?: Vec2): void
    {
        this.handleTexture(texture as WebGPUTexture2D);

        const i = this.m_currentInstanceIndex * STRIDE;

        // /******************* SETUP OPTIMIZATION VECTORS ******************/
        // it's easier to reason with vector.

        // TODO: use first with passed
        // const origin = origin ?? this.origin;
        const origin = this.origin;

        // move to top left by default
        const x = draw_rect.x - draw_rect.w * .5;
        const y = draw_rect.y - draw_rect.h * .5;

        const w = draw_rect.w;
        const h = draw_rect.h;

        // draw inner fills buffer correctly with positions, texture coordinates, tint color and increase the current instance index.
        this.drawInner(i, x, y, w, h, rotation_in_radians, rotation_anchor, tint_color);
    }

    /**
     * @inheritdoc
     */
    public drawSource (texture: Texture2D, drawRect: Rect, sourceRect: Rect, tintColor?: Color, rotationInRadians?: number, rotationAnchor?: Vec2): void
    {
        this.handleTexture(texture as WebGPUTexture2D);

        // find current index, but take into account stride.
        const i = this.m_currentInstanceIndex * STRIDE;

        // move to top left by default
        const x = drawRect.x - drawRect.w * .5;
        const y = drawRect.y - drawRect.h * .5;

        const w = drawRect.w;
        const h = drawRect.h;

        // draw inner fills buffer correctly with positions, texture coordinates, tint color and increase the current instance index.
        this.drawInnerSource(
            i,
            x, y, w, h,
            sourceRect,
            rotationInRadians, rotationAnchor, tintColor);

    }

    /**
     * @inheritdoc
     */
    public drawOnPosition (texture: Texture2D, position: Vec2, tint_color?: Color, rotation_in_radians?: number, rotation_anchor?: Vec2, scale_factor?: Vec2): void
    {
        this.handleTexture(texture as WebGPUTexture2D);

        let i = this.m_currentInstanceIndex * STRIDE;

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
        this.drawInner(i, x, y, w, h, rotation_in_radians, rotation_anchor, tint_color);
    }

    /**
     * @brief End the sprite rendering.
     */
    public end (): void
    {
        this.gpuDraw();
    }
}
