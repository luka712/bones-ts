export class GLVertexBufferUtil 
{
    /**
     * Allocates the matrix attrib pointer. Note that 4 locations are needed. If location is 4, location 5,6,7 must be free.
     * @param gl context
     * @param location start location
     * @param divisor if divisor is to be used, for instancing. Leave empty if not to be used.
     */
    public static allocateMatrixAttribPointer (gl: WebGL2RenderingContext, location: number, divisor = 0): void 
    {
        const byteOffset = Float32Array.BYTES_PER_ELEMENT * 4;
        const stride = Float32Array.BYTES_PER_ELEMENT * 16;

        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, 4, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(location + 1);
        gl.vertexAttribPointer(location + 1, 4, gl.FLOAT, false, stride, byteOffset);
        gl.enableVertexAttribArray(location + 2);
        gl.vertexAttribPointer(location + 2, 4, gl.FLOAT, false, stride, 2 * byteOffset);
        gl.enableVertexAttribArray(location + 3);
        gl.vertexAttribPointer(location + 3, 4, gl.FLOAT, false, stride, 3 * byteOffset);


        // this line says this attribute only changes for each 1 instance
        if (divisor > 0)
        {
            gl.vertexAttribDivisor(location, divisor);
            gl.vertexAttribDivisor(location + 1, divisor);
            gl.vertexAttribDivisor(location + 2, divisor);
            gl.vertexAttribDivisor(location + 3, divisor);
        }
    }
}