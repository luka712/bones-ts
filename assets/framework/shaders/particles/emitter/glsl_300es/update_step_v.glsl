#version 300 es 
precision highp float;

// works as follow
// attributes need to be setup before update
// uniforms are passed on update.

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

uniform sampler2D u_texture0; // randomness texture.

// the projection matrices.
uniform mat4x4 u_projectionMatrix;
uniform mat4x4 u_viewMatrix;

// time since last update step
uniform float u_deltaTime;

// Emits from origin.
uniform vec3 u_origin;

// emit in x direction, min max
uniform vec2 u_xDirectionMinMax;

// emit in y direction, min max
uniform vec2 u_yDirectionMinMax;

// emit in z direction, min max
uniform vec2 u_zDirectionMinMax;

// the friction factor. The factor close to 1 won't stop particles. Keep small values here.
// for example 0.999, to large friction factor will increase acceleration.
uniform float u_frictionFactor;

// initial speed min max. On emit
uniform vec2 u_minMaxSpeed;

// add force
uniform vec3 u_force;

// the particle max age.
uniform float u_maxAge;

// outputs, must mirror the inputs, These values will be captured into transform feedback buffer.
out vec3 v_position;
out vec3 v_velocity;
out vec3 v_acceleration;
out float v_age;
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

/**
* vec4 contains 4 random values between 0 and 1 
*/ 
vec4 random4(vec2 coords) 
{
    int x = gl_VertexID % 100000;
    int y = gl_VertexID % 50000;

    // random values
    return texture(u_texture0, vec2(coords.x * 100000.0/ float(x), coords.y * 50000.0 / float(y)));
}

/**
* Gets the random value between min and max for random value.
*/ 
float randValueBetweenMinMax(vec2 min_max, float r)
{
    return min_max.x + r * (min_max.y - min_max.x);
}

void main()
{
    if(a_age < 0.0)
    {
        // emit direction
        vec4 rand = random4(a_position.xy);

        // reset current position.
        v_position = (u_projectionMatrix * u_viewMatrix * vec4(u_origin, 1.0)).xyz;  
   
        float x  = randValueBetweenMinMax(u_xDirectionMinMax, rand.x);
        float y  = randValueBetweenMinMax(u_yDirectionMinMax, rand.y);
        float z  = randValueBetweenMinMax(u_zDirectionMinMax, rand.z);

        // 2d particles. Initial velocity.
        v_velocity = vec3(x,y,z);

        // random speed between min and max.
        float r = randValueBetweenMinMax(u_minMaxSpeed, rand.y);
        v_velocity = normalize(v_velocity);
        v_velocity *= (r * 0.00005);

        // if there is some force acting on particles, add it.
        v_velocity += u_force * r * 0.0001;
        v_age = u_maxAge * r;
        v_acceleration = vec3(0.0);
    }
    else
    {
        // standard euler
        // v += a
        // p += v
        v_acceleration = a_acceleration;
        v_velocity = a_velocity + a_acceleration;
        // add friction
        v_position = a_position + v_velocity * u_deltaTime;

        v_age = a_age - u_deltaTime;

        // add friction force.
        v_acceleration *= u_frictionFactor;

        // if there is some force acting on particles, add it.
        v_velocity += u_force;

        v_debug = vec4(v_age);
    }


}