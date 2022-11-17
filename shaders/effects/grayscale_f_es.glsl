#version 300 es        
precision highp float;
     
in vec2 v_texCoords;

uniform sampler2D u_texture;
     
out vec4 outColor;
     
void main() 
{
    outColor = texture(u_texture,v_texCoords);
    // get the weighted average.
    float average = 0.2126 * outColor.r + 0.7152 * outColor.g + 0.0722 * outColor.b;
    outColor = vec4(average, average, average, 1.0);
}