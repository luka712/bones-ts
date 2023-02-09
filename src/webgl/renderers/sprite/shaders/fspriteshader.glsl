#version 300 es        
precision highp float;
     
in vec2 v_texCoords;
in vec4 v_tintColor;

uniform sampler2D u_texture;
     
layout(location = 0)out vec4 outColor;
layout(location = 1)out vec4 outBrightColor;
     
void main() 
{
    outColor = texture(u_texture,v_texCoords) * v_tintColor;
    outColor.rgb *= outColor.a;
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