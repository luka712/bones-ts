import dat from "dat.gui";
import { Effect } from "../framework/bones_post_process";
import { Framework } from "../framework/Framework";
import { FrameworkPlugin } from "../framework/plugin/FrameworkPlugin"
import { DatGuiEffectComponent, DatGuiEffectComponentOptions } from "./DatGuiEffectComponent";
import { GUI } from "./interfaces";

//******************* DATGUI IMAGE ***********************/
// The magic here!
import datGuiImage from 'dat.gui.image';
// @ts-ignore
datGuiImage(dat);

export class DatGuiPlugin extends FrameworkPlugin 
{
    private m_framework: Framework;

    public readonly datGuiInstance: GUI;

    constructor()
    {
        super();
        this.datGuiInstance = new dat.GUI({
            width: 400
        }) as GUI;
    }

    /**
     * The setup method.
     * @param { Framework } framework 
     */
    public setup (framework: Framework): void
    {
        this.m_framework = framework;
    }

    /**
     * Creates the effect component.
     * @param { Effect } effect - effect to create component for.
     * @param { GUI } parent_folder - folder to which to add component to.
     * @param { string } name - name of component.
     * @param { (() => void) } on_use - on use callback
     * @param { { [id:string] : DatGuiEffectComponentOptions} | undefined } options_per_uniform - optional options per uniform
     */
    public createEffectComponent (effect: Effect, parent_folder: GUI, name: string, on_use: (() => void), options_per_uniform?: {
        [id: string]: DatGuiEffectComponentOptions
    }) 
    {
        return new DatGuiEffectComponent(this.m_framework.textureManager, effect, parent_folder, name, on_use,)
    }
}