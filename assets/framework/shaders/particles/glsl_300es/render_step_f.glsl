#version 300 es
precision mediump float;

in vec4 v_debug;

out vec4 o_FragColor;

void main() 
{
  o_FragColor = vec4(v_debug.x * 0.1, 0.7, 0.3, 0.1);
}