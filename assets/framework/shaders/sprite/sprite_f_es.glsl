#version 300 es        
precision highp float;
     
in vec2 v_texCoords;

uniform sampler2D u_texture;
uniform vec4 u_tint_color;
     
layout(location = 0)out vec4 outColor;
layout(location = 1)out vec4 outBrightColor;
     
void main() 
{
    outColor = texture(u_texture,v_texCoords) * u_tint_color;
    float luminance = dot(vec3(0.2126, 0.7152, 0.0722), outColor.rgb);
    if(luminance > 0.7)
    {
        outBrightColor = outColor;
    }
    else
    {
        outBrightColor = vec4(0.0, 0.0,0.0,1.0);
    }
}