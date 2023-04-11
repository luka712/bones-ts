#version 300 es
precision highp float;

layout (location = 0) in vec2 a_position;
layout (location = 1) in vec2 a_centerPoint;
layout (location = 2) in float a_radius;
layout (location = 3) in float a_angleOffset;


uniform mat4 u_projectionView;

void main()
{
    vec2 position = a_position;

    gl_PointSize = 3.0;

    // now rotate it
    float s = sin(a_angleOffset);
    float c = cos(a_angleOffset);
    float x = position.x;
    float y = position.y;
    position.x = x * c - y * s;
    position.y = x * s + y * c;
    
    position *= a_radius;

    // offset for center point.
    position += a_centerPoint;

    gl_Position = u_projectionView * vec4(position, 0.0, 1.0);
}