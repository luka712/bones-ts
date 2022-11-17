#version 300 es
precision mediump float;

// particle position
layout (location = 0) in vec3 a_position;

// the velocity of a particle
layout (location = 1) in vec3 a_velocity;

// the acceleration.
layout (location = 2) in vec2 a_acceleration;

layout (location = 3) in vec4 a_debug;

out vec4 v_debug;

void main() 
{
    v_debug = a_debug;
    gl_PointSize = 3.0;
    gl_Position = vec4(a_position, 1.0);
}