#version 300 es        
precision highp float;

// Clamps colors to certain color of texture. For example if average color is 0.75, texel from position x on texture at 0.75 will be selected.
// texture might be something like | red | blue | green | yellow |
// where                          0.0 ---0.25---0.5-----0.75---- 1.0
// so average value of 0.4 would be blue 
// it can be any texture of anycolors. Please note that example is 1 dimensional, but 2 dimensional texture can be used also, or 1d of any alignment.
// 2d textues don't make much sense though, since x,y are always same.
     
in vec2 v_texCoords;

uniform sampler2D u_texture0; // framebuffer
uniform sampler2D u_texture1; // color texture ( ideally it should be texture where all colors are in one row/col but can be 2 dimensional as well )

// custom uniforms 
// by default (0.2126,0.7152,0.0722)
uniform vec3 u_weights;
     
out vec4 outColor;
     
void main() 
{
    vec4 texel_color = texture(u_texture0,v_texCoords);
    
    // get the weighted average.
    float average = dot(texel_color.rgb, u_weights); 

    vec4 color_sample = texture(u_texture1, vec2(average));

    outColor = color_sample;
}