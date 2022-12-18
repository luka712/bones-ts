#version 300 es
precision mediump float;

in vec2 v_texCoords;

// This is the texture that we will be applying the blur to
uniform sampler2D u_texture0;

// Blur size - the larger the value, the more blurry the resulting image
uniform float u_blurSize = 1.0;
  
out vec4 outColor;

void main()
{             
	// Guassian blur weights. The weights should sum to 1 to preserve the overall brightness of the image. 
	float weights[5] = float[](0.2270270270, 0.1945945946, 0.1216216216, 0.0540540541, 0.0162162162);

	ivec2 texture_size = textureSize(u_texture0,0);

	// Texel offset, determines how far to sample from center of texel.
	vec2 texel_offset = vec2(1.0 / float(texture_size.x) * u_blurSize, 0.0);

	outColor = vec4(0.0);

	outColor += texture(u_texture0, v_texCoords - 4.0 * texel_offset) * weights[4];
	outColor += texture(u_texture0, v_texCoords - 3.0 * texel_offset) * weights[3];
	outColor += texture(u_texture0, v_texCoords - 2.0 * texel_offset) * weights[2];
	outColor += texture(u_texture0, v_texCoords - 1.0 * texel_offset) * weights[1];
	outColor += texture(u_texture0, v_texCoords) * weights[0];
	outColor += texture(u_texture0, v_texCoords + 1.0 * texel_offset) * weights[1];
	outColor += texture(u_texture0, v_texCoords + 2.0 * texel_offset) * weights[2];
	outColor += texture(u_texture0, v_texCoords + 3.0 * texel_offset) * weights[3];
	outColor += texture(u_texture0, v_texCoords + 4.0 * texel_offset) * weights[4];
	
	
}