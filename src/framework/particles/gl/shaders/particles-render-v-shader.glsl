#version 300 es
precision mediump float;

layout (location = 0) in float a_useNum; // this is global for instanced drawing

// particle position
layout (location = 1) in vec2 a_position;

// the velocity of a particle
layout (location = 2) in vec2 a_velocity;

// the age of a particle
layout (location = 3) in float a_currentAge;

// the max life of a particle
layout(location = 4) in float a_maxAge;

out vec2 v_position;
out float v_currentAge;
out float v_maxAge;

void main() 
{
    v_position = a_position;
    v_currentAge = a_currentAge;
    v_maxAge = a_maxAge;
    gl_PointSize = 5.0;
    gl_Position = vec4(a_position, 0.0, 1.0);
}