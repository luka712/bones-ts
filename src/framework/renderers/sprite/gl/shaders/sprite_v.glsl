#version 300 es

layout (location = 0) in vec3 a_vertex; 
layout (location = 1) in vec2 a_texCoords;
layout (location = 2) in vec4 a_tintColor;

out vec2 v_texCoords;
out vec4 v_tintColor;

// Global UBO
layout (std140) uniform GlobalUBO 
{
    mat4 projectionViewMatrix;
};


void main()
{
    v_texCoords = a_texCoords;
    v_tintColor = a_tintColor;
    gl_Position = projectionViewMatrix * vec4(a_vertex, 1.0);
}