// group 1, updated for each instance
@group(1) @binding(1) 
var<uniform> u_color: vec4<f32>;

// group 2, updated for each instance, texture.
@group(2) @binding(0)
var u_sampler: sampler;
@group(2) @binding(1)
var u_texture: texture_2d<f32>; 

@fragment
fn main(@location(0) v_texCoords: vec2<f32>) -> @location(0) vec4<f32> 
{
    return vec4<f32>(1.0, 1.0, 1.0, textureSample(u_texture, u_sampler, v_texCoords).r) * u_color;
}