struct VSOutputFSInput
{
    @builtin(position) Position: vec4<f32>,
    @location(0) v_texCoords: vec2<f32>,
    @location(1) v_tintColor: vec4<f32>,
};


// for global stuff ( 1 per frame )
struct GlobalUBO 
{
    projectionViewMatrix: mat4x4<f32>,
};

 // group 0, update once per pass 
 @group(0) @binding(0) var<uniform> u_global: GlobalUBO;

@vertex
fn vs_main(
        @location(0) a_vertex: vec3<f32>,
        @location(1) a_texCoords: vec2<f32>,
        @location(2) a_tintColor: vec4<f32>) -> VSOutputFSInput 
{
    var out: VSOutputFSInput;
    out.Position = u_global.projectionViewMatrix * vec4<f32>(a_vertex, 1.0);
    out.v_texCoords = a_texCoords;
    out.v_tintColor = a_tintColor;
    return out;
}


// FRAGMENT
struct FSOutput 
{
    @location(0) o_color: vec4<f32>,
    @location(1) o_brightColor: vec4<f32>
};


// group 1
@group(1) @binding(0) var u_sampler: sampler;
@group(1) @binding(1) var u_texture: texture_2d<f32>; 

@fragment
fn fs_main(
    @location(0) v_texCoords: vec2<f32>,
    @location(1) v_tintColor: vec4<f32>) -> FSOutput
{
    var out: FSOutput;
    out.o_color = textureSample(u_texture, u_sampler, v_texCoords) * v_tintColor;
    // out.o_color.r *= out.o_color.a;
    // out.o_color.g *= out.o_color.a;
    // out.o_color.b *= out.o_color.a;

    // bright color
    var amount = (out.o_color.r + out.o_color.g + out.o_color.b) / 3.0;
    
    if(amount > 7.0)
    {
        out.o_brightColor = out.o_color;
    }
    else 
    {
        out.o_brightColor = vec4<f32>(0.0);
    }

    return out;
}