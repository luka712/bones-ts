struct VSResult
{
    @builtin(position) Position: vec4<f32>,
    @location(0) v_texCoords: vec2<f32>,
 };

struct CameraUBO 
{
    projectionMatrix: mat4x4<f32>,
    viewMatrix: mat4x4<f32>
}

 struct TransformUBO
 {
    transformMatrix: mat4x4<f32>
 };

 // group 0, update once per pass 
 @group(0) @binding(0)
 var<uniform> u_camera: CameraUBO;

 // group 1, updated for each instance
 @group(1) @binding(0)
 var<uniform> u_transform: TransformUBO;

@vertex
fn main(@location(0) a_vertex: vec3<f32>,
        @location(1) a_texCoords: vec2<f32>) -> VSResult 
{
    var out: VSResult;
    out.Position = u_camera.projectionMatrix * u_camera.viewMatrix * u_transform.transformMatrix * vec4<f32>(a_vertex, 1.0);
    out.v_texCoords = a_texCoords;
    return out;
}