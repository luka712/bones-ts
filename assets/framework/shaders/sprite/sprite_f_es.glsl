#version 300 es        
precision highp float;
     
in vec2 v_texCoords;

uniform sampler2D u_texture;
uniform vec4 u_tint_color;
     
out vec4 outColor;
     
void main() 
{
    outColor = texture(u_texture,v_texCoords) * u_tint_color;
}