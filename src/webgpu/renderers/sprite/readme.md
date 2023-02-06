#### WebGPUSpriteRenderer 

WebGPU sprite renderer is different then WebGL renderer, be mindfull of that.

Works as follows.

1. for each texture there will be pipeline part which holds pipeline,
 data to be filled, texture view, uniforms, attribute buffers and bind group.  
 In short everything needed for draw call!!!
2. however texture and part are cached, so as long as texture is not changed, keep writing into large attribute buffer ( it's max size can be set ).
3. when end() is called, or texture is changed draw everything.

##### Shader 

holds:
- two matrices ( projection and view ) as uniforms. Bound once per texture
- texture and sampler as uniforms. Bounds once per texture
- attributes ( pos3, texCoords2, tintColor4). Bound once per texture. Size is determined by max number of instances requested. Also indices buffer.

