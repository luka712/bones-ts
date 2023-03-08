#version 300 es        
precision highp float;
     
in vec4 v_vertexColor;
in vec4 v_diffuseColor;

layout(location = 0)out vec4 outColor;
layout(location = 1)out vec4 outBrightColor;

void main()
{
    outColor =  v_vertexColor * v_diffuseColor;

    // bright color
    float amount = (outColor.r + outColor.g + outColor.b) / 3.0;
    
    if(amount > 7.0)
    {
        outBrightColor = outColor;
    }
    else 
    {
        outBrightColor = vec4(0.0);
    }
}