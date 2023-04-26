#version 300 es
precision mediump float;

// particle position
layout (location = 0) in vec2 a_position;

// the velocity of a particle
layout (location = 1) in vec2 a_velocity;

// the age of a particle
layout (location = 2) in float a_age;

// the max life of a particle
layout(location = 3) in float a_life;

out float v_age;

void main() 
{
    v_age = a_age;
    gl_PointSize = 3.0;
    gl_Position = vec4(a_position, 0.0, 1.0);
}