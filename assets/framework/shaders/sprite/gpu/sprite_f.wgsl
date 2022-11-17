// group 1, updated for each instance
@group(1) @binding(1) 
var<uniform> u_tintColor: vec4<f32>;

@fragment
fn main(@location(0) v_texCoords: vec2<f32>) -> @location(0) vec4<f32> 
{
    return u_tintColor;
}