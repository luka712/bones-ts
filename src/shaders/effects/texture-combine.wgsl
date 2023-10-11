struct VSResult
{
    @builtin(position) Position: vec4<f32>,
    @location(0) v_texCoords: vec2<f32>,
};


@vertex
fn vs_main(@location(0) a_vertex: vec3<f32>,
           @location(1) a_texCoords: vec2<f32>) -> VSResult 
{
    var out: VSResult;
    out.Position = vec4<f32>(a_vertex, 1.0);
    out.v_texCoords = a_texCoords;
    return out;
}

// group 0, updated for each instance, is a scene texture
@group(0) @binding(0)
var u_sampler0: sampler;
@group(0) @binding(1)
var u_texture0: texture_2d<f32>; 

// group 1, updated for each instance, is a texture to combine scene with
@group(1) @binding(0)
var u_sampler1: sampler;
@group(1) @binding(1)
var u_texture1: texture_2d<f32>;

// mix value
@group(2) @binding(0)
var<uniform> u_mixValue: f32;

@fragment
fn fs_main(@location(0) v_texCoords: vec2<f32>) -> @location(0) vec4<f32> 
{
    var sceneTex = textureSample(u_texture0, u_sampler0, v_texCoords).rgb;
    var overlayTex = textureSample(u_texture1, u_sampler1, v_texCoords).rgb;

    var color = mix(sceneTex.xyz, overlayTex.xyz, u_mixValue);

    return vec4f(color, 1.0);
   
}