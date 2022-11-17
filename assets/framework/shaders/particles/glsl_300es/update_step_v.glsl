#version 300 es 
precision mediump float;

// randomness https://umbcgaim.wordpress.com/2010/07/01/gpu-random-numbers/

// works as follow
// attributes need to be setup before update
// uniforms are passed on update.

// particle position
layout (location = 0) in vec3 a_position;

// the velocity of a particle
layout (location = 1) in vec3 a_velocity;

// the force vector.
layout (location = 2) in vec3 a_acceleration;

// debug information
layout (location = 3) in vec4 a_debug;

// the projection matrices.
uniform mat4x4 u_projectionMatrix;
uniform mat4x4 u_viewMatrix;

// time since last update step
uniform float u_deltaTime;

uniform sampler2D u_texture0; // randomness texture.
uniform sampler2D u_texture1; // flow texture.

// max speed of particle
uniform float u_maxSpeed;

// max force to apply to particle
uniform float u_maxForce;

// where particles should go.
uniform vec3 u_target;

// add force
uniform vec3 u_force;

// outputs, must mirror the inputs, These values will be captured into transform feedback buffer.
out vec3 v_position;
out vec3 v_velocity;
out vec3 v_acceleration;
out vec4 v_debug;

vec3 limit(vec3 vec_to_limit, float max_length)
{
    float l = length(vec_to_limit);
    if(l > max_length)
    {
        vec3 r = normalize(vec_to_limit);
        r *= max_length;
        return r;
    }
    return vec_to_limit;
}

vec4 randomness() 
{
    // find some noise coordine
    ivec2 noise_coord = ivec2(gl_VertexID % 512);

    // random values
    return texelFetch(u_texture0, noise_coord, 0) * 2.0 - vec4(1.0);
}

float map(float value, float start1, float stop1 , float start2, float stop2)
{
    return ((value - start1)/(stop1 - start1)) * (stop2 - start2) + start2;
}

void main()
{
    vec3 target = (u_projectionMatrix * u_viewMatrix * vec4(u_target, 1.0)).xyz;
    
    // Seek steering force algorithm
    vec3 desired = target - a_position;

    desired = normalize(desired);
    desired *= u_maxSpeed;

    // steer towards target
    vec3 steer = desired - a_velocity;
    steer = limit(steer, u_maxForce);
    
    // apply force.
    vec3 acceleration = a_acceleration + steer;
    
    // Standard "Euler integration" motion model
    vec3 velocity = a_velocity;
    velocity += acceleration;
    // velocity = limit(velocity, u_maxSpeed);

    acceleration.xy += u_force.xy * randomness().xy * 0.005;

    vec4 flow_field = texture(u_texture1, a_position.xy);
    acceleration.xy += (flow_field.xy - 0.5) * 0.02;

    velocity += acceleration;

    vec3 position = a_position + velocity;
    position.z = 0.0;

    
    // set outputs 
    v_position += position;
    v_velocity += velocity;
    v_acceleration += a_acceleration;

    v_debug.x = flow_field.x;
    v_debug.y = flow_field.y;
    v_debug.z = flow_field.x;
    v_debug.w = position.y;
}