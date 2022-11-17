import { Vec2 } from "../framework/bones_math";
import { Effect } from "../framework/bones_post_process";
import { TextureManager, Texture2D, TextureWrap } from "../framework/bones_texture";
import { Vec3 } from "../framework/math/vec/Vec3";
import { ShaderUniformType } from "../framework/shaders/Shader";
import { GUI } from "./interfaces";

export interface DatGuiEffectComponentOptions 
{
    /**
     * If type is a vector, create normalize button.
     */
    allowNormalize: boolean;
}

/**
 * Creates component which reads uniforms of effect shader and creates UI elements to control values. 
 */
export class DatGuiEffectComponent 
{
    /**
     * The constructor.
     * 
     * @param { TextureManager } texture_manager - the texture manager.
     * @param { Effect } effect - the effect to create controls for.
     * @param { GUI } parent_folder - the parent folder.
     * @param { string } name - the name of submenu.
     * @param { ((): void) } on_use - callback, when use is clicked.
     */
    constructor(
        private readonly m_textureManager: TextureManager,
        effect: Effect,
        parent_folder: GUI,
        name: string,
        on_use: () => void,
        options_per_uniform?: {
            [id: string]: DatGuiEffectComponentOptions
        })
    {
        const folder = parent_folder.addFolder(name);

        const object = {
            "Use": on_use,
        }
        folder.add(object, "Use");

        for (const key in effect.shader.uniformValues)
        {
            const shader_uniform = effect.shader.uniformValues[key];

            // FLOAT
            if (shader_uniform.type == ShaderUniformType.Float)
            {
                const val = {
                    [key]: shader_uniform.value
                }
                folder.add(val, key, shader_uniform.minValue as number, shader_uniform.maxValue as number)
                    .onChange(v => 
                    {
                        val[key] = v;
                        shader_uniform.value = v;
                    });
            }
            // VEC2
            else if (shader_uniform.type == ShaderUniformType.Vec2)
            {
                const vec_folder = folder.addFolder(key);
                const val = {
                    x: shader_uniform.value[0],
                    y: shader_uniform.value[1]
                };

                const x_gui = vec_folder.add(val, "x", shader_uniform.minValue[0], shader_uniform.maxValue[0])
                    .onChange(v =>
                    {
                        val.x = v;
                        shader_uniform.value[0] = v;
                    });
                const y_gui = vec_folder.add(val, "y", shader_uniform.minValue[1], shader_uniform.maxValue[1])
                    .onChange(v =>
                    {
                        val.y = v;
                        shader_uniform.value[1] = v;
                    });

                if (options_per_uniform && options_per_uniform[key]?.allowNormalize)
                {
                    const normalize_obj = {
                        "normalize": () => 
                        {
                            (shader_uniform.value as Vec2).normalize();
                            val.x = shader_uniform.value[0];
                            val.y = shader_uniform.value[1];

                            x_gui.updateDisplay();
                            y_gui.updateDisplay();
                        }
                    };

                    folder.add(normalize_obj, "normalize");
                }
            }
            // VEC3 
            else if (shader_uniform.type == ShaderUniformType.Vec3)
            {
                const vec_folder = folder.addFolder(key);
                const val = {
                    x: shader_uniform.value[0],
                    y: shader_uniform.value[1],
                    z: shader_uniform.value[2],
                };

                const x_gui = vec_folder.add(val, "x", shader_uniform.minValue[0], shader_uniform.maxValue[0])
                    .onChange(v =>
                    {
                        val.x = v;
                        shader_uniform.value[0] = v;
                    });
                const y_gui = vec_folder.add(val, "y", shader_uniform.minValue[1], shader_uniform.maxValue[1])
                    .onChange(v =>
                    {
                        val.y = v;
                        shader_uniform.value[1] = v;
                    });
                const z_gui = vec_folder.add(val, "z", shader_uniform.minValue[2], shader_uniform.maxValue[2])
                    .onChange(v =>
                    {
                        val.y = v;
                        shader_uniform.value[2] = v;
                    });

                if (options_per_uniform[key] && options_per_uniform[key]?.allowNormalize)
                {
                    const normalize_obj = {
                        "normalize": () => 
                        {
                            (shader_uniform.value as Vec3).normalize();

                            val.x = shader_uniform.value[0];
                            val.y = shader_uniform.value[1];
                            val.z = shader_uniform.value[2];

                            x_gui.updateDisplay();
                            y_gui.updateDisplay();
                            z_gui.updateDisplay();
                        }
                    };

                    folder.add(normalize_obj, "normalize");
                }
            }
        }


        // textures
        this.handleTexture(folder, effect.shader.texture1, (v: Texture2D) => effect.shader.texture1 = v);
        this.handleTexture(folder, effect.shader.texture2, (v: Texture2D) => effect.shader.texture2 = v);
        this.handleTexture(folder, effect.shader.texture3, (v: Texture2D) => effect.shader.texture3 = v);
    }

    /**
     * Create a texture ui for folder.
     * @param folder - the gui folder.
     * @param texture - the current texture value.
     * @param callback - new texture if changed.
     */
    private handleTexture (folder: GUI, texture: Texture2D, callback: (Texture2D) => void)
    {
        if (texture)
        {
            const texture_obj = {};

            const path = this.m_textureManager.getPath(texture);
            const key = this.m_textureManager.getKey(texture);
            texture_obj[key] = path;

            folder.addImage(texture_obj, key).onChange((value: HTMLImageElement) => 
            {
                const tex = this.m_textureManager.createCacheTexture(value, key, value.width, value.height, { textureWrap: TextureWrap.Repeat });
                callback(tex);
            });
        }

    }
}
