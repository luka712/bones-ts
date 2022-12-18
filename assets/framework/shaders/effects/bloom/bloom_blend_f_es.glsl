#version 300 es
precision mediump float;

in vec2 v_texCoords;

uniform sampler2D u_texture0; // scene
uniform sampler2D u_texture1; // blur

uniform float u_blurFactor = 1.0; // the strength of blur

out vec4 outColor;

void main()
{             
    vec3 scene_color = texture(u_texture0, v_texCoords).rgb;      
    vec3 blur_color = texture(u_texture1, v_texCoords).rgb;
    
    // add blur to original image.
    scene_color += blur_color * u_blurFactor;

    outColor = vec4(scene_color, 1.0);
}