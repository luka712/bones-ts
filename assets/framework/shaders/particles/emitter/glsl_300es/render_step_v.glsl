#version 300 es
precision mediump float;

// particle position
layout (location = 0) in vec3 a_position;

// the velocity of a particle
layout (location = 1) in vec3 a_velocity;

// the force vector.
layout (location = 2) in vec3 a_acceleration;

// the age of a particle
layout (location = 3) in float a_age;

// debug information
layout (location = 4) in vec4 a_debug;

out vec4 v_debug;

void main() 
{
    v_debug = a_debug;
    gl_PointSize = 2.0;
    gl_Position = vec4(a_position, 1.0);
}