#version 300 es

layout (location = 0) in vec3 a_vertex; 
layout (location = 1) in vec2 a_texCoords;

out vec2 v_texCoords;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_transform_matrix;

void main()
{
    v_texCoords = a_texCoords.xy;
    gl_Position = u_projectionMatrix* u_viewMatrix* u_transform_matrix * vec4(a_vertex, 1.0);
}