import { Texture2D } from "../textures/Texture2D";
import { Effect } from "./Effect";
import sourceCode from "../../shaders/effects/texture-combine.wgsl?raw"
import { publicDecrypt } from "crypto";


export class TextureCombineEffect extends Effect {


    protected sourceCode (): string {
        return sourceCode;
    }

    // COMBINE TEXTURE
    /**
     * The combine texture is the texture which is combined with the source texture in the fragment shader.
     */
    private m_combineTexture: Texture2D;
    private m_combineTextureBindGroupLayout: GPUBindGroupLayout;
    private m_combineTextureBindGroup: GPUBindGroup;

    // MIX VALUE
    private m_mixValue: number = 0.5;
    private m_mixValueBindGroupLayout: GPUBindGroupLayout;
    private m_mixValueBindGroup: GPUBindGroup;
    private m_mixValueBuffer: GPUBuffer;


    /**
    * Get the mix value.
    * This is the value which is used to mix the combine texture with the source texture in the fragment shader.
    * The value is clamped between 0 and 1.
    * 0 means that the source(scene) texture is used.
    * 1 means that the combine texture is used.
    * 0.5 means that the textures are mixed equally.
     */
    public getMixValue (): number {
        return this.m_mixValue;
    }

    /**
     * Sets the mix value.
     * This is the value which is used to mix the combine texture with the source texture in the fragment shader.
     * The value is clamped between 0 and 1.
     * 0 means that the source(scene) texture is used.
     * 1 means that the combine texture is used.
     * 0.5 means that the textures are mixed equally.
     */
    public setMixValue (value: number): void {
        // Clamp the value between 0 and 1
        value = Math.min(1, Math.max(0, value));
        this.m_mixValue = value;

        // Update mix value buffer
        this.m_device.queue.writeBuffer(this.m_mixValueBuffer, 0, new Float32Array([this.m_mixValue]));
    }

    /**
     * The combine texture.
     * This is the texture which is combined with the source texture in the fragment shader.
     */
    public get combineTexture (): Texture2D {
        return this.m_combineTexture;
    }

    /**
     * The combine texture.
     * This is the texture which is combined with the source texture in the fragment shader.
     */
    public set combineTexture (value: Texture2D) {
        this.m_combineTexture = value;
        this.createCombineTextureBindGroup();
    }

    /**
   * Creates the bind group layouts.
   * Internally this method is called by the initialize method.
   * Internally creates @see {@link m_sourceTextureBindGroupLayout}
   * Internally creates @see {@link m_combineTextureBindGroupLayout}
   * Internally creates @see {@link m_mixValueBindGroupLayout}
   * @returns @see {@link Array} of {@link GPUBindGroupLayout}
   */
    protected createBindGroupLayouts (): Array<GPUBindGroupLayout> {
        const layouts = super.createBindGroupLayouts();

        // Combine texture bind group layout
        this.m_combineTextureBindGroupLayout = this.m_device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                }
            ]
        });

        // Mix value bind group layout
        this.m_mixValueBindGroupLayout = this.m_device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {}
                }
            ]
        });

        layouts.push(this.m_combineTextureBindGroupLayout);
        layouts.push(this.m_mixValueBindGroupLayout);

        return layouts;
    }

    /**
     * Needs to be recreated whenever the combine texture changes.
     * @returns @see {@link GPUBindGroup}
     */
    private createCombineTextureBindGroup() : GPUBindGroup 
    {
        this.m_combineTextureBindGroup = this.m_device.createBindGroup({
            layout: this.m_combineTextureBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: this.combineTexture.sampler
                },
                {
                    binding: 1,
                    resource: this.combineTexture.texture.createView()
                }
            ]
        });

        return this.m_combineTextureBindGroup;
    }

    /**
    * Creates the bind groups.
    * @param layouts @see {@link Array} of {@link GPUBindGroupLayout}
    * Internally this method is called by the initialize method.
    * Internally creates @see {@link m_sourceTextureBindGroup}
    * @returns @see {@link Array} of {@link GPUBindGroup}
    */
    protected createBindGroups (layouts: Array<GPUBindGroupLayout>): Array<GPUBindGroup> {

        const bindGroups = super.createBindGroups(layouts);

        // Combine texture bind group
        bindGroups.push(this.createCombineTextureBindGroup());

        // Mix value bind group
        this.m_mixValueBindGroup = this.m_device.createBindGroup({
            layout: this.m_mixValueBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.m_mixValueBuffer
                    }
                }
            ]
        });

        bindGroups.push(this.m_mixValueBindGroup);

        return bindGroups;
    }

    public async initialize (): Promise<void> {

        // Create buffer first, it is needed for the super.initialize() method (createBindGroups)
        this.m_combineTexture = await this.m_framework.textureManager.createEmpty(1, 1);
        this.m_mixValueBuffer = this.m_device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // Update mix value buffer
        this.m_device.queue.writeBuffer(this.m_mixValueBuffer, 0, new Float32Array([this.m_mixValue]));
        await super.initialize();
    }

    /**
     * Draws the effect to the destination texture.
     * @param destinationTexture @see {@link GPUTexture} The destination texture. Usually the texture that was rendered to the screen.
     */
    public draw (destinationTexture: GPUTexture): void {

        const commandEncoder = this.m_device.createCommandEncoder();
        const passEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: destinationTexture.createView(),
                loadOp: "clear",
                storeOp: "store"
            }]
        });

        passEncoder.setPipeline(this.m_pipeline);
        passEncoder.setVertexBuffer(0, this.m_buffer);
        passEncoder.setBindGroup(0, this.m_sourceTextureBindGroup);
        passEncoder.setBindGroup(1, this.m_combineTextureBindGroup);
        passEncoder.setBindGroup(2, this.m_mixValueBindGroup);
        passEncoder.draw(6, 1, 0, 0);

        passEncoder.end();
        this.m_device.queue.submit([commandEncoder.finish()]);
    }
}