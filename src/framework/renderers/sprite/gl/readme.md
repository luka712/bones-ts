#### WebGLSpriteRenderer 

WebGL sprite renderer is different then WebGPU renderer, be mindfull of that.

Works as follows.

1. There is global shader program. For WebGPU pipeline is created for each texture. That's the main difference!!!.
2. We keep global instanceIndex for WebGL renderer. When texture is passed in everything is drawn and instance index is restarted. So it's not drawn at end, rather it's drawn on each texture changed. This means that in order to optimize, textures should be sorted!!!.
3. end draws as well, since there is no texture change.


##### Shader 

holds:
- 1 matrix ( projectionView ) as uniform. Bound once per texture
- texture and sampler as uniforms. Bounds once per texture
- attributes ( pos3, texCoords2, tintColor4). Bound once per texture. Size is determined by max number of instances requested. Also indices buffer.
