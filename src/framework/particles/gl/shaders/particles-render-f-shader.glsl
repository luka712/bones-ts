#version 300 es
precision mediump float;


in float v_age;

out vec4 o_FragColor;

void main() 
{
  o_FragColor = vec4(v_age,1.0,1.0, 1.0);
}