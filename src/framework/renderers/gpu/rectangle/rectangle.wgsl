struct VSOutputFSInput
{
    @builtin(position) Position: vec4<f32>
};

struct PerInstanceData {
    position: vec2<f32>,
    size: vec2<f32>
}

// group 0, update once per pass 
@group(0) @binding(0) var<uniform> u_projectionView: mat4x4<f32>;

// group 1, update once per instance
@group(1) @binding(0) var<storage, read> u_instanceData: array<PerInstanceData>;



@vertex
fn vs_main(
    @builtin(instance_index) instanceIdx : u32,
    @location(0) a_position: vec2<f32>) -> VSOutputFSInput 
{
    var  position: vec2<f32> = a_position;    
    position *= u_instanceData[instanceIdx].size;
    position += u_instanceData[instanceIdx].position;

    var out: VSOutputFSInput;
    out.Position = u_projectionView * vec4<f32>(position, 0.0, 1.0);

    return out;
}


// FRAGMENT
struct FSOutput 
{
    @location(0) o_color: vec4<f32>,
    @location(1) o_brightColor: vec4<f32>
};

@group(2) @binding(0) var<uniform> u_color: vec4<f32>;


@fragment
fn fs_main() -> FSOutput
{
    var out: FSOutput;
    out.o_color = u_color;
    
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