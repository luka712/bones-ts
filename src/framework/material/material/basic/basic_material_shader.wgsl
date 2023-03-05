

// for global stuff ( 1 per frame )
struct UBO 
{
    projectionViewMatrix: mat4x4<f32>,
    transformMatrix: mat4x4<f32>,
    diffuseColor: vec4<f32>
};


 // group 0, update once per pass 
 @group(0) @binding(0) var<uniform> u_ubo: UBO;

struct VSOutputFSInput
{
    @builtin(position) Position: vec4<f32>,
    @location(0) v_vertexColor: vec4<f32>,
    @location(1) v_diffuseColor: vec4<f32>
};


@vertex
fn vs_main(
    @location(0) a_vertex: vec3<f32>,
    @location(1) a_vertexColor: vec4<f32>) -> VSOutputFSInput 
{
    var out: VSOutputFSInput;
    out.Position = u_ubo.projectionViewMatrix * u_ubo.transformMatrix * vec4<f32>(a_vertex, 1.0);
    out.v_vertexColor = a_vertexColor;
    out.v_diffuseColor = u_ubo.diffuseColor;
    return out;
}



// FRAGMENT
struct FSOutput 
{
    @location(0) color: vec4<f32>,
    @location(1) brightColor: vec4<f32>
};


@fragment
fn fs_main(@location(0) v_vertexColor: vec4<f32>,
           @location(1) v_diffuseColor: vec4<f32>) -> FSOutput
{
    var out: FSOutput;
    out.color =  v_vertexColor * v_diffuseColor;

    // bright color
    var amount = (out.color.r + out.color.g + out.color.b) / 3.0;
    
    if(amount > 7.0)
    {
        out.brightColor = out.color;
    }
    else 
    {
        out.brightColor = vec4<f32>(0.0);
    }

    return out;
}