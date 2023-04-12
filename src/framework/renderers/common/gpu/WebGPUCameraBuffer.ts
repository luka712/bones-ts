import { Mat4x4 } from "../../../bones_math";

export class WebGPUCameraBuffer 
{
    private static m_projectionViewUniformBuffer?: GPUBuffer;

    public static get projectionViewUniformBuffer() : GPUBuffer 
    {
        return this.m_projectionViewUniformBuffer;
    }

    /**
     * Gets the camera buffer.
     * @param device - the gpu device.
     * @returns 
     */
    private static get2DCameraBuffer (device: GPUDevice): GPUBuffer
    {
        if (!this.m_projectionViewUniformBuffer)
        {
            this.m_projectionViewUniformBuffer = device.createBuffer({
                // projectionView matrix
                size: Float32Array.BYTES_PER_ELEMENT * 16,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });
        }

        return this.m_projectionViewUniformBuffer;
    }

    /**
     * Gets the 2d camera buffer.
     * @param device 
     * @param matrix 
     */
    public static writeTo2DCameraBuffer(device: GPUDevice, matrix: Mat4x4) : void 
    {
        device.queue.writeBuffer(this.get2DCameraBuffer(device), 0, matrix.buffer, 0, matrix.byteLength);
    }
}