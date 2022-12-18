#version 300 es

// use this as shader for effects where whole screen needs to be used
// for example when post processing.

layout (location = 0) in vec3 a_vertex; 
layout (location = 1) in vec2 a_texCoords;

out vec2 v_texCoords;

void main()
{
    v_texCoords = a_texCoords.xy;
    gl_Position = vec4(a_vertex, 1.0);
}
