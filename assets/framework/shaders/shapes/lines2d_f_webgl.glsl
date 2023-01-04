#version 300 es        
precision highp float;
      
layout(location = 0)out vec4 outColor;
layout(location = 1)out vec4 outBrightColor;
     
void main() 
{
    outColor = vec4(1.0, 0.0,0.0,1.0);
    float luminance = dot(vec3(0.2126, 0.7152, 0.0722), outColor.rgb);
    if(luminance > 0.7)
    {
        outBrightColor = outColor;
    }
    else
    {
        outBrightColor = vec4(0.0, 0.0,0.0,1.0);
    }