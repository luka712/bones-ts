import { Framework } from "../Framework";
import { Color, Rect, Vec2 } from "../bones_math";
import { BufferUtil } from "../buffer/BufferUtil";
import { SpriteRendereCamera } from "../camera/SpriteRendererCamera";
import { FLOATS_PER_INSTANCE, SPRITE_RENDERER_MAX_SPRITES_PER_DRAW, SpritePipeline } from "./SpritePipeline";
import { Texture2D } from "../textures/Texture2D";
import { SpriteFont } from "../fonts/SpriteFont";


export class SpriteRenderer {

    /**
     * The device.
     */
    private m_device: GPUDevice;

    /**
     * The index buffer.
     */
    private m_indexBuffer: GPUBuffer;

    /**
     * The vertex buffer stack.
     */
    private m_vertexBufferStack: Array<GPUBuffer> = [];

    /** 
     * The projection view matrix buffer.
     */
    private m_projectionViewMatrixBuffer: GPUBuffer;

    /**
     * The camera.
     */
    private m_camera: SpriteRendereCamera;

    /**
     * The current draw pipelines per texture. At the end of frame pop from this pipeline to allocated pipelines.
     * If there is no allocated pipeline, create a new one and push it here.
    */
    private m_currentDrawPipelines: { [key: number]: Array<SpritePipeline> } = {};


    /**
     * All the allocated pipelines per texture. Pop from this pipeline to current draw pipelines.
     * At the end of frame, push back to this pipeline from current draw pipelines.
     */
    private m_allocatedPipelines: { [key: number]: Array<SpritePipeline> } = {};


    // Just for optimization
    private mo_topLeft = Vec2.zero();
    private mo_topRight = Vec2.zero();
    private mo_bottomLeft = Vec2.zero();
    private mo_bottomRight = Vec2.zero();
    private mo_rotationOriginOffset = Vec2.zero();
    private mo_defaultTintColor = Color.white();
    private mo_defaultOrigin = Vec2.zero();
    private mo_defaultScale = Vec2.one();

    constructor(private m_framework: Framework) {
    }

    private setupIndexBuffer (): GPUBuffer {

        const data = new Uint16Array(6 * SPRITE_RENDERER_MAX_SPRITES_PER_DRAW);

        for (let i = 0; i < SPRITE_RENDERER_MAX_SPRITES_PER_DRAW; i++) {
            // t1
            data[i * 6 + 0] = i * 4 + 0;
            data[i * 6 + 1] = i * 4 + 1;
            data[i * 6 + 2] = i * 4 + 2;

            // t2
            data[i * 6 + 3] = i * 4 + 2;
            data[i * 6 + 4] = i * 4 + 3;
            data[i * 6 + 5] = i * 4 + 0;
        }

        this.m_indexBuffer = BufferUtil.createIndexBuffer(this.m_device, data);
        return this.m_indexBuffer;
    }

    /**
     * Gets or creates a pipeline for the texture.
     * Creation is handled internally.
     * @param texture The texture.
     * @returns The pipeline
     */
    private getPipeline (texture: Texture2D): SpritePipeline {
        const id = texture.id;

        this.m_currentDrawPipelines[id] = this.m_currentDrawPipelines[id] ?? [];
        this.m_allocatedPipelines[id] = this.m_allocatedPipelines[id] ?? [];

        // if not found allocated new vector array for texture name key. No need to check both, they should have same keys.
        if (this.m_currentDrawPipelines[id].length == 0) {

            // first check if there is one in allocated pipelines. If so get it from there
            if (this.m_allocatedPipelines[id].length > 0) {
                const pipeline = this.m_allocatedPipelines[id].pop();
                this.m_currentDrawPipelines[id].push(pipeline);
                return pipeline;
            }

            // if not found, we are sure that there is no pipeline, create one and push it to current draw pipelines.
            const pipeline = SpritePipeline.create(this.m_device, texture, this.m_projectionViewMatrixBuffer);
            this.m_currentDrawPipelines[id].push(pipeline);
            this.m_allocatedPipelines[id].push(pipeline);
            return pipeline;
        }

        // get last 
        const array = this.m_currentDrawPipelines[id];
        const topPipeline = array[array.length - 1];
        // if pipeline is full, allocate a new pipeline.
        if (topPipeline.instanceIndex == SPRITE_RENDERER_MAX_SPRITES_PER_DRAW) {

            // if there is no allocated pipeline, create one and push it to current draw pipelines.
            // return then new pipeline.
            if (this.m_allocatedPipelines[id].length == 0) {
                const pipeline = SpritePipeline.create(this.m_device, texture, this.m_projectionViewMatrixBuffer);
                this.m_currentDrawPipelines[id].push(pipeline);
                this.m_allocatedPipelines[id].push(pipeline);
                return pipeline;
            }

            const pipeline = this.m_allocatedPipelines[id].pop();
            this.m_currentDrawPipelines[id].push(pipeline);
            return pipeline;
        }

        return topPipeline;
    }

    public initialize (): void {

        this.m_device = this.m_framework.renderer.device;
        this.m_projectionViewMatrixBuffer = BufferUtil.createUniformBuffer(this.m_device, 16 * Float32Array.BYTES_PER_ELEMENT);

        // setup camera
        const size = this.m_framework.renderer.bufferSize;
        this.m_camera = new SpriteRendereCamera(size.x, size.y);

        this.m_indexBuffer = this.setupIndexBuffer();
    }

    public beginFrame () {
        // 0 can be passed, camera is not using dt
        this.m_camera.update(0);

        const queue = this.m_device.queue;

        // write camera to buffer
        queue.writeBuffer(this.m_projectionViewMatrixBuffer, 0, this.m_camera.projectionViewMatrix);

        // empty the draw pipelines
        for (const key in this.m_currentDrawPipelines) {
            this.m_currentDrawPipelines[key].length = 0;
        }
    }

    /**
     * Draws the sprite.
     * @param texture The texture to draw.
     * @param drawRect The draw rect. It is drawing area on screen.
     * @param sourceRect The source rect. It is the area of the texture to draw.
     * @param tintColor The tint color.
     * @param rotationInRadians The rotation in radians.
     * @param rotationOrigin The rotation origin.
     */
    public draw (texture: Texture2D, drawRect: Rect, sourceRect: Rect,
        tintColor: Color = this.mo_defaultTintColor,
        rotationInRadians: number = 0,
        rotationOrigin: Vec2 = this.mo_defaultOrigin) {

        const pipeline = this.getPipeline(texture);

        let i = pipeline.instanceIndex * FLOATS_PER_INSTANCE;

        const d = pipeline.dataArray;

        // position
        this.mo_topLeft.setValues(drawRect.x, drawRect.y);
        this.mo_topRight.setValues(drawRect.x + drawRect.width, drawRect.y);
        this.mo_bottomLeft.setValues(drawRect.x, drawRect.y + drawRect.height);
        this.mo_bottomRight.setValues(drawRect.x + drawRect.width, drawRect.y + drawRect.height);

        // perform rotation
        if (rotationInRadians != 0) {
            this.mo_rotationOriginOffset.setValues(
                this.mo_topLeft.x + drawRect.w * rotationOrigin.x,
                this.mo_topLeft.y + drawRect.h * rotationOrigin.y);

            this.mo_topLeft.rotateAroundPoint(this.mo_rotationOriginOffset, rotationInRadians);
            this.mo_topRight.rotateAroundPoint(this.mo_rotationOriginOffset, rotationInRadians);
            this.mo_bottomLeft.rotateAroundPoint(this.mo_rotationOriginOffset, rotationInRadians);
            this.mo_bottomRight.rotateAroundPoint(this.mo_rotationOriginOffset, rotationInRadians);
        }

        // texture coordinates
        const u0 = sourceRect.x / texture.width;
        const v0 = sourceRect.y / texture.height;
        const u1 = (sourceRect.x + sourceRect.width) / texture.width;
        const v1 = (sourceRect.y + sourceRect.height) / texture.height;

        // t1
        d[i + 0] = this.mo_topLeft.x;
        d[i + 1] = this.mo_topLeft.y;
        d[i + 2] = 0;        // z
        d[i + 3] = u0;          // u
        d[i + 4] = v0;          // v
        d[i + 5] = tintColor.r; // r
        d[i + 6] = tintColor.g; // g
        d[i + 7] = tintColor.b; // b
        d[i + 8] = tintColor.a; // a

        // t2
        d[i + 9] = this.mo_topRight.x;
        d[i + 10] = this.mo_topRight.y;
        d[i + 11] = 0.0;        // z
        d[i + 12] = u1;          // u
        d[i + 13] = v0;          // v
        d[i + 14] = tintColor.r; // r
        d[i + 15] = tintColor.g; // g
        d[i + 16] = tintColor.b; // b
        d[i + 17] = tintColor.a; // a

        // t3
        d[i + 18] = this.mo_bottomRight.x;
        d[i + 19] = this.mo_bottomRight.y;
        d[i + 20] = 0.0;        // z
        d[i + 21] = u1;          // u
        d[i + 22] = v1;          // v
        d[i + 23] = tintColor.r; // r
        d[i + 24] = tintColor.g; // g
        d[i + 25] = tintColor.b; // b
        d[i + 26] = tintColor.a; // a

        // t4
        d[i + 27] = this.mo_bottomLeft.x;
        d[i + 28] = this.mo_bottomLeft.y;
        d[i + 29] = 0.0;        // z
        d[i + 30] = u0;          // u
        d[i + 31] = v1;          // v
        d[i + 32] = tintColor.r; // r
        d[i + 33] = tintColor.g; // g
        d[i + 34] = tintColor.b; // b
        d[i + 35] = tintColor.a; // a

        pipeline.instanceIndex++;
    }

    public drawOnPosition (texture: Texture2D,
        position: Vec2,
        tintColor: Color = this.mo_defaultTintColor,
        rotationInRadians: number = 0,
        rotationOrigin: Vec2 = this.mo_defaultOrigin,
        scale: Vec2 = this.mo_defaultScale) {

        const pipeline = this.getPipeline(texture);

        let i = pipeline.instanceIndex * FLOATS_PER_INSTANCE;

        const d = pipeline.dataArray;

        // position
        const w = texture.width * scale.x;
        const h = texture.height * scale.y;

        this.mo_topLeft.setValues(position.x, position.y);
        this.mo_topRight.setValues(position.x + w, position.y);
        this.mo_bottomLeft.setValues(position.x, position.y + h);
        this.mo_bottomRight.setValues(position.x + w, position.y + h);

        // perform rotation
        if (rotationInRadians != 0) {
            this.mo_rotationOriginOffset.setValues(
                this.mo_topLeft.x + w * rotationOrigin.x,
                this.mo_topLeft.y + h * rotationOrigin.y);

            this.mo_topLeft.rotateAroundPoint(this.mo_rotationOriginOffset, rotationInRadians);
            this.mo_topRight.rotateAroundPoint(this.mo_rotationOriginOffset, rotationInRadians);
            this.mo_bottomLeft.rotateAroundPoint(this.mo_rotationOriginOffset, rotationInRadians);
            this.mo_bottomRight.rotateAroundPoint(this.mo_rotationOriginOffset, rotationInRadians);
        }

        // texture coordinates
        const u0 = 0;
        const v0 = 0;
        const u1 = 1;
        const v1 = 1;

        // t1
        d[i + 0] = this.mo_topLeft.x;
        d[i + 1] = this.mo_topLeft.y;
        d[i + 2] = 0;        // z
        d[i + 3] = u0;          // u
        d[i + 4] = v0;          // v
        d[i + 5] = tintColor.r; // r
        d[i + 6] = tintColor.g; // g
        d[i + 7] = tintColor.b; // b
        d[i + 8] = tintColor.a; // a

        // t2
        d[i + 9] = this.mo_topRight.x;
        d[i + 10] = this.mo_topRight.y;
        d[i + 11] = 0.0;        // z
        d[i + 12] = u1;          // u
        d[i + 13] = v0;          // v
        d[i + 14] = tintColor.r; // r
        d[i + 15] = tintColor.g; // g
        d[i + 16] = tintColor.b; // b
        d[i + 17] = tintColor.a; // a

        // t3
        d[i + 18] = this.mo_bottomRight.x;
        d[i + 19] = this.mo_bottomRight.y;
        d[i + 20] = 0.0;        // z
        d[i + 21] = u1;          // u
        d[i + 22] = v1;          // v
        d[i + 23] = tintColor.r; // r
        d[i + 24] = tintColor.g; // g
        d[i + 25] = tintColor.b; // b
        d[i + 26] = tintColor.a; // a

        // t4
        d[i + 27] = this.mo_bottomLeft.x;
        d[i + 28] = this.mo_bottomLeft.y;
        d[i + 29] = 0.0;        // z
        d[i + 30] = u0;          // u
        d[i + 31] = v1;          // v
        d[i + 32] = tintColor.r; // r
        d[i + 33] = tintColor.g; // g
        d[i + 34] = tintColor.b; // b
        d[i + 35] = tintColor.a; // a

        pipeline.instanceIndex++;

    }

    public drawString (font: SpriteFont, text: string, position: Vec2, 
        tintColor: Color, scale = 1) {

        let advanceX = 0;
        for (const textChar of text) {

            const pipeline = this.getPipeline(font.texture!);
            let i = pipeline.instanceIndex * FLOATS_PER_INSTANCE;

            const data = pipeline.dataArray;

            const fontChar = font.getChar(textChar);

            const x = position.x + (advanceX + fontChar.offset.x) * scale;
            const y = position.y + fontChar.offset.y * scale;
            const w = fontChar.size.x * scale;
            const h = fontChar.size.y * scale;

            // position
            this.mo_topLeft.setValues(x, y);
            this.mo_topRight.setValues(x + w, y);
            this.mo_bottomRight.setValues(x + w, y + h);
            this.mo_bottomLeft.setValues(x, y + h);

            // texture coordinates
            const a = fontChar.textureCoords.topLeft;
            const b = fontChar.textureCoords.topRight;
            const c = fontChar.textureCoords.bottomRight;
            const d = fontChar.textureCoords.bottomLeft;

            // t1
            data[i + 0] = this.mo_topLeft.x;
            data[i + 1] = this.mo_topLeft.y;
            data[i + 2] = 0;        // z
            data[i + 3] = a.x;          // u
            data[i + 4] = a.y;          // v
            data[i + 5] = tintColor.r; // r
            data[i + 6] = tintColor.g; // g
            data[i + 7] = tintColor.b; // b
            data[i + 8] = tintColor.a; // a

            // t2
            data[i + 9] = this.mo_topRight.x;
            data[i + 10] = this.mo_topRight.y;
            data[i + 11] = 0.0;        // z
            data[i + 12] = b.x;          // u
            data[i + 13] = b.y;          // v
            data[i + 14] = tintColor.r; // r
            data[i + 15] = tintColor.g; // g
            data[i + 16] = tintColor.b; // b
            data[i + 17] = tintColor.a; // a

            // t3
            data[i + 18] = this.mo_bottomRight.x;
            data[i + 19] = this.mo_bottomRight.y;
            data[i + 20] = 0.0;        // z
            data[i + 21] = c.x;          // u
            data[i + 22] = c.y;          // v
            data[i + 23] = tintColor.r; // r
            data[i + 24] = tintColor.g; // g
            data[i + 25] = tintColor.b; // b
            data[i + 26] = tintColor.a; // a

            // t4
            data[i + 27] = this.mo_bottomLeft.x;
            data[i + 28] = this.mo_bottomLeft.y;
            data[i + 29] = 0.0;        // z
            data[i + 30] = d.x;          // u
            data[i + 31] = d.y;          // v
            data[i + 32] = tintColor.r; // r
            data[i + 33] = tintColor.g; // g
            data[i + 34] = tintColor.b; // b
            data[i + 35] = tintColor.a; // a

            advanceX += fontChar.advance;
            pipeline.instanceIndex++;
        }

    }

    public endFrame () {

        const queue = this.m_device.queue;
        const renderPass = this.m_framework.context.currentRenderPassEncoder;
    
        const tempVertexBufferStack = [];

        // go through each key
        for(const textureId in this.m_currentDrawPipelines) {

            // go through each pipeline
            const pipelineStack = this.m_currentDrawPipelines[textureId];

            // while there are entries
            while(pipelineStack.length != 0)
            {
                const spritePipeline = pipelineStack.pop();
                this.m_allocatedPipelines[textureId].push(spritePipeline);

                const pipeline = spritePipeline.pipeline;
                const projectionViewBindGroup = spritePipeline.projectionViewBindGroup;
                const textureBindGroup = spritePipeline.textureBindGroup;

                // allocate or get a vertex buffer
                let vertexBuffer: GPUBuffer;
                if(this.m_vertexBufferStack.length == 0)
                {
                    const byteSize = SPRITE_RENDERER_MAX_SPRITES_PER_DRAW * FLOATS_PER_INSTANCE * Float32Array.BYTES_PER_ELEMENT;
                     vertexBuffer = BufferUtil.createEmptyVertexBuffer(this.m_device, byteSize, "Sprite Vertex Buffer");
                }
                else 
                {
                    vertexBuffer = this.m_vertexBufferStack.pop();
                }

                // pust to temp stack
                tempVertexBufferStack.push(vertexBuffer);

                // copy data to vertex buffer
                const byteSize = spritePipeline.instanceIndex * FLOATS_PER_INSTANCE * Float32Array.BYTES_PER_ELEMENT;
                queue.writeBuffer(vertexBuffer, 0, spritePipeline.dataArray.buffer, 0, byteSize);

                // set pipeline
                renderPass.setPipeline(pipeline);

                // set bind groups
                renderPass.setBindGroup(0, projectionViewBindGroup);
                renderPass.setBindGroup(1, textureBindGroup);

                // set vertex index buffers
                renderPass.setVertexBuffer(0, vertexBuffer);
                renderPass.setIndexBuffer(this.m_indexBuffer, "uint16");

                // draw
                renderPass.pushDebugGroup("Draw Sprite");
                // TODO: can be probably index instance
                renderPass.drawIndexed(SPRITE_RENDERER_MAX_SPRITES_PER_DRAW * 6, 1, 0, 0, 0);
                renderPass.popDebugGroup();

                // reset instance index
                spritePipeline.instanceIndex = 0;
            }
        }

        // return vertex buffers to stack
        while(tempVertexBufferStack.length != 0)
        {
            this.m_vertexBufferStack.push(tempVertexBufferStack.pop());
        }
    }
}