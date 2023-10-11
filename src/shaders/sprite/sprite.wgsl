struct VSResult
{
    @builtin(position) Position: vec4<f32>,
    @location(0) v_texCoords: vec2<f32>,
    @location(1) v_tintColor: vec4<f32>
};

 // group 0, update once per pass 
 @group(0) @binding(0)
 var<uniform> u_projectionViewMatrix: mat4x4<f32>;

@vertex
fn vs_main(@location(0) a_vertex: vec3<f32>,
           @location(1) a_texCoords: vec2<f32>,
           @location(2) a_tintColor: vec4<f32>) -> VSResult 
{
    var out: VSResult;
    out.Position = u_projectionViewMatrix * vec4<f32>(a_vertex, 1.0);
    out.v_texCoords = a_texCoords;
    out.v_tintColor = a_tintColor;
    return out;
}

// group 1, updated for each instance, texture.
@group(1) @binding(0)
var u_sampler: sampler;
@group(1) @binding(1)
var u_texture: texture_2d<f32>; 

@fragment
fn fs_main(@location(0) v_texCoords: vec2<f32>, @location(1) v_tintColor: vec4<f32>) -> @location(0) vec4<f32> 
{
   return textureSample(u_texture, u_sampler, v_texCoords) * v_tintColor;
}