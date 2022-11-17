#version 300 es        
precision highp float;
     
in vec2 v_texCoords;

// provided uniforms
uniform sampler2D u_texture0; // framebuffer
uniform sampler2D u_texture1; // scanlines
uniform sampler2D u_texture2; // vignette
uniform sampler2D u_texture3; // perlin noise
uniform float u_time;
uniform float u_random;

// custom uniforms
uniform vec2 u_redOffset;
uniform vec2 u_greenOffset;
uniform vec2 u_blueOffset;
uniform float u_bendFactor;  // please pass 4.0 by default
uniform float u_scanlineSpeed; // please pass -0.08 by default
uniform float u_scanlineMixStrength; // please pass 0.05 by default
uniform float u_noiseMixStrength; // please pass 0.05 by default

out vec4 outColor;
     
/**
 * Creates crt coordinates, which are bended by band factor.
 */
vec2 crt_coords(vec2 uv, float bend)
{
    // move to -0.5 to 0.5 space
	uv -= 0.5;

    // move to -1 to 1 space
    uv *= 2.;

    // use squared function to create bend, instead of linear function.
    uv.x *= 1. + pow(abs(uv.y)/bend, 2.);
    uv.y *= 1. + pow(abs(uv.x)/bend, 2.);
    
    // return to -0.5 to 0.5 space
    uv /= 2.;

    // return to 0 to 1 space
    return uv + .5;
}

// The vignette effect
vec4 vignette(vec2 uv)
{
   return texture(u_texture2, uv);
}

// Create a scanline from u_texture1 ( set to scanline internally)
// uv - coordinates
// speed - speed ot movemenet
vec4 scanline(vec2 uv, float speed)
{
    // create a texture from unit 1.
    // y is offset for time * speed
    return texture(u_texture1, vec2(uv.x, (uv.y + u_time * speed) ));
}

// creates a perlin noise functon from texture unit 3
vec4 noise(vec2 uv)
{
 	return texture(u_texture3, (uv + .5) * u_random * 100.);
}


void main()
{
    vec2 uv = v_texCoords;
    
    vec2 crt_uv = crt_coords(uv, u_bendFactor);
    
    vec4 s1 = scanline(uv, u_scanlineSpeed);
    
    vec4 col;
    // texture0 if framebuffer texture, or everything that was rendered to it.
    col.r = texture(u_texture0, crt_uv + u_redOffset).r;
    col.g = texture(u_texture0, crt_uv + u_greenOffset).g;
    col.b = texture(u_texture0, crt_uv + u_blueOffset).b;
    col.a = texture(u_texture0, crt_uv).a;
    
    col = mix(col, s1 , u_scanlineMixStrength);
	outColor = mix(col, noise(uv), u_noiseMixStrength) * vignette(uv);
}