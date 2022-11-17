#version 300 es        
precision highp float;
     
in vec2 v_texCoords;

uniform sampler2D u_texture0;
     
out vec4 outColor;
     
void main() 
{
    vec2 red_offset = vec2(-0.01, 0.);
    vec2 green_offset = vec2(0.);
    vec2 blue_offset = vec2(0.01, 0.);

    outColor.r = texture(u_texture,v_texCoords + red_offset).r;
    outColor.g = texture(u_texture,v_texCoords + green_offset).g;
    outColor.b = texture(u_texture,v_texCoords + blue_offset).b;
    outColor.a = texture(u_texture,v_texCoords ).a;
}