#version 300 es

layout (location = 0) in vec3 a_vertex; 
layout (location = 1) in vec2 a_texCoords;
layout (location = 2) in vec4 a_tintColor;

out vec2 v_texCoords;
out vec4 v_tintColor;

struct GlobalUBO 
{
    mat4 projectionViewMatrix;
};
uniform GlobalUBO u_global;


void main()
{
    v_texCoords = a_texCoords;
    v_tintColor = a_tintColor;
    gl_Position = u_global.projectionViewMatrix * vec4(a_vertex, 1.0);
}