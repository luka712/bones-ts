#version 300 es
precision highp float;

layout (location = 0) in vec2 a_vertex;
layout (location = 1) in vec2 a_position;
layout (location = 2) in vec2 a_size;


uniform mat4 u_projectionView;

void main()
{
    vec2 position = a_vertex;

    gl_PointSize = 3.0;

    position *= a_size;
    position += a_position;

    gl_Position = u_projectionView * vec4(position, 0.0, 1.0);
}