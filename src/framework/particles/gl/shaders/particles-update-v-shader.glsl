#version 300 es 
precision highp float;

// works as follow
// attributes need to be setup before update
// uniforms are passed on update.

// particle position
layout (location = 0) in vec2 a_position;

// the velocity of a particle
layout (location = 1) in vec2 a_velocity;

// the age of a particle
layout (location = 2) in float a_currentAge;

// the life of a particle
layout (location = 3) in float a_maxAge;

uniform sampler2D u_texture0; // randomness texture.

// the projection matrices.
uniform mat4x4 u_projectionViewMatrix;

// time since last update step
uniform float u_deltaTime;

// Emits from origin.
uniform vec2 u_origin;

// the particle max age.
uniform float u_maxAge;

uniform float u_frictionFactor;

// should new particles be emitted
uniform int u_emitNew;

// outputs, must mirror the inputs, These values will be captured into transform feedback buffer.
out vec2 v_position;
out vec2 v_velocity;
out float v_currentAge;
out float v_maxAge;

/**
* vec4 contains 4 random values between 0 and 1 
*/ 
vec4 random4() 
{
    int x = gl_VertexID % 512;
    int y = gl_VertexID / 512;

    // random values
    return texelFetch(u_texture0, ivec2(x,y), 0);
}

/**
* Gets the random value between min and max for random value.
*/ 
float randValueBetweenMinMax(vec2 min_max, float r)
{
    return min_max.x + r * (min_max.y - min_max.x);
}

void restartParticle()
{
    v_currentAge = a_maxAge; // restart age

    // emit direction
    vec4 rand = random4();

    // reset current position.
    v_position = (u_projectionViewMatrix * vec4(u_origin, 0.0, 1.0)).xy;  

    // 2PI * rand.x 
    float angle = 6.283 * (-1.0 + rand.x + rand.y);

    float x = cos(angle);
    float y = sin(angle);
    v_velocity = vec2(x * 0.001 * rand.y, y * 0.001 * rand.y);
}

void main()
{
    // write here values that should always be passed. Should be constant
    v_maxAge = a_maxAge;

    // is particle dead ? 
    if(a_currentAge <= 0.0)
    {
        if(u_emitNew == 1)
        {
            restartParticle();
        }
    }
    else
    {
        // add friction
        v_position = a_position + a_velocity * u_deltaTime;

        v_currentAge = a_currentAge - u_deltaTime;

        v_velocity = a_velocity * 0.9999;
    }
}