export class ShaderSource 
{
    /**
     * Used for shaders which need to get color from single uniform.
     * For example, lines rendering, lines joints, lines caps.
     */
    public static readonly COMMON_COLOR_FRAGMENT_SHADER = `#version 300 es        
    precision highp float;
    
    uniform vec4 u_color;
          
    layout (location = 0)out vec4 outColor;
    layout (location = 1)out vec4 outBrightColor;
        
    void main() 
    {
        outColor = u_color;
        float amount = (outColor.r + outColor.g + outColor.b) / 3.0;
        if(amount > 0.7)
        {
            outBrightColor = outColor;
        }
        else
        {
            outBrightColor = vec4(0.0, 0.0,0.0,1.0);
        }
    }
    `;
}