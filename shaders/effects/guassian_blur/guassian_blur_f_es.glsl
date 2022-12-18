#version 300 es
precision mediump float;

in vec2 v_texCoords;

uniform sampler2D u_texture;
  
uniform bool u_horizontal;

float u_weight[5] = float[] (0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

out vec4 outColor;

void main()
{             
    vec2 tex_offset = vec2(1.0) / vec2(textureSize(u_texture, 0)); // gets size of single texel
    vec3 result = texture(u_texture, v_texCoords).rgb * u_weight[0]; // current fragment's contribution
    if(u_horizontal)
    {
        for(int i = 1; i < 5; i++)
        {
            result += texture(u_texture, v_texCoords + vec2(tex_offset.x * float(i), 0.0)).rgb * u_weight[i];
            result += texture(u_texture, v_texCoords - vec2(tex_offset.x * float(i), 0.0)).rgb * u_weight[i];
        }
    }
    else
    {
        for(int i = 1; i < 5; i++)
        {
            result += texture(u_texture, v_texCoords + vec2(0.0, tex_offset.y * float(i))).rgb * u_weight[i];
            result += texture(u_texture, v_texCoords - vec2(0.0, tex_offset.y * float(i))).rgb * u_weight[i];
        }
    }
    outColor = vec4(result, 1.0);
}