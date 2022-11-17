#version 300 es
precision mediump float;

// this shader does nothing, it exists only because WebGL pipeline needs to have fragment shader intialized.
// can be used in multiple particles systems.

void main() { discard; }