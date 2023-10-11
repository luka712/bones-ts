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

// group 0, updated for each instance, texture.
@group(0) @binding(0)
var u_sampler: sampler;
@group(0) @binding(1)
var u_texture: texture_2d<f32>; 

@fragment
fn fs_main(@location(0) v_texCoords: vec2<f32>) -> @location(0) vec4<f32> 
{
    var texColor = textureSample(u_texture, u_sampler, v_texCoords).rgb;
    var weights = vec3<f32>(0.2126, 0.7152, 0.0722);
    var gray = dot(texColor, weights);
    return vec4<f32>(gray, gray, gray, 1.0);
}