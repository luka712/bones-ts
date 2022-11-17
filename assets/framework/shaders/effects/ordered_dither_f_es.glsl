#version 300 es        
precision highp float;
     
in vec2 v_texCoords;

uniform sampler2D u_texture0;

// Postprocess shaders should always have some uniforms available. u_resolution is one.
uniform vec2 u_resolution;
     
out vec4 outColor;


mat4x4 threshold = mat4x4(0., 8., 2., 10., 
                                12., 4., 14., 6.,
                                3.,11.,1.,9.,
                                15.,7.,13., 5.);


float findClosest(int x, int y, float v)
{
    mat4x4 thresholdT = transpose(threshold);
    float t = (thresholdT[x][y]) / 16.;
    if(v < t)
    {
      	return 0.;   
    }
    else
    {
     	return 1.;   
    }
}

     
void main() 
{
    outColor = texture(u_texture0,v_texCoords);

    int x = int(v_texCoords.x * u_resolution.x) % 4;
    int y = int(v_texCoords.y * u_resolution.y) % 4;

    // get the weighted average.
    float average = 0.2126 * outColor.r + 0.7152 * outColor.g + 0.0722 * outColor.b;
    average = findClosest(x,y,average);

    outColor = vec4(average, average, average, 1.0);
}