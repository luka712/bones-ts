precision highp float;

layout(location = 0) in attribute a_position;
layout(location = 1) in attribute a_pointA;
layout(location = 2) in attribute a_pointB; 

uniform float u_width;

uniform mat4 u_projection_matrix;
uniform mat4 u_view_matrix;

void main()
{
    // get x basis, which is just direction from a towards b
    vec2 x_basis = a_pointB - a_pointA;
    // get y basic, which is normal unit vector of x basis.
    vec2 y_basis = normalize(vec2(-x_basis.y, x_basis.x));

    vec2 point = a_pointA * x_basis * a_position.x + y_basis * u_width * a_position.y;
    gl_Position = u_projection_matrix * u_view_matrix * vec4(point, 0.0, 1.0);
}
