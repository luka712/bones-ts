#version 300 es        
precision highp float;
     
in vec2 v_texCoords;

// text texture
uniform sampler2D u_texture;

// color that font will be.
uniform vec4 u_color;     

out vec4 outColor;
     
void main() 
{
    // RGB color is set to 1 value, and that is alpha, so use just .r channel
    outColor = vec4(1.0, 1.0, 1.0, texture(u_texture, v_texCoords).r) * u_color;
}