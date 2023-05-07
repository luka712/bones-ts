#version 300 es
precision mediump float;

in vec2 v_position;
in float v_currentAge;
in float v_maxAge;

uniform vec2 u_resolution;

out vec4 o_FragColor;

float circle(vec2 st,  float radius)
{
    float d = distance(v_position, st);
	return 1.-smoothstep(radius-(radius*0.01), radius+(radius*0.01),dot(d,d)*4.0);
}

void main() 
{
    // gl_FragCoord is window coordnate, move to 0 to 1 space
    vec2 st = gl_FragCoord.xy / u_resolution;
    
    // move to -1 to 1 space
    st -= 0.5;
    st *= 2.0; 


    // a. The DISTANCE from the pixel to the center
    float c = circle(st, 0.00010);
    if(c <= 0.0) discard;

    o_FragColor = vec4(vec2(c), 1.0, 1.0);
}