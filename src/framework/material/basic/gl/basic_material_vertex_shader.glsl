#version 300 es

layout (location = 0) in vec3 a_vertex; 
layout (location = 1) in vec4 a_vertexColor;
layout (location = 2) in mat4 a_transform; // per instances, this is instanced draw

// for global stuff ( 1 per frame )
struct UBO 
{
    mat4 projectionViewMatrix;
    vec4 diffuseColor;
};


//  update once per pass 
uniform UBO u_global;

out vec4 v_vertexColor;
out vec4 v_diffuseColor;

void main()
{
    gl_Position = u_global.projectionViewMatrix * a_transform * vec4(a_vertex, 1.0);
    v_vertexColor = a_vertexColor;
    v_diffuseColor = u_global.diffuseColor;
}