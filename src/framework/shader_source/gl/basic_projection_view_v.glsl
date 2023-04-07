#version 300 es
precision highp float;

layout (location = 0) in vec2 a_position;


uniform mat4 u_projectionView;

void main()
{
    gl_Position = u_projectionView * vec4(a_position, 0.0, 1.0);
}