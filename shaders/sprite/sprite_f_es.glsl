#version 300 es        
precision highp float;
     
in vec2 v_texCoords;

uniform sampler2D u_texture;
     
out vec4 outColor;
     
void main() 
{
    outColor = texture(u_texture,v_texCoords);
}