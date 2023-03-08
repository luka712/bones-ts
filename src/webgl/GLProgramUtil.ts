export class GLProgramUtil 
{
    /**
     * Gets the webgl uniform location
     * @param gl 
     * @param program 
     * @param location 
     * @param log optionally log error to console. By default true.
     */
    public static getUniformLocation(gl: WebGL2RenderingContext, program: WebGLProgram, uniformName: string, log: boolean = true) : WebGLUniformLocation
    {
        const location = gl.getUniformLocation(program, uniformName);
        if(location <= 0){
            console.error(`Cannot find location with name '${uniformName}'!`);
        }
        return location;
    }
}