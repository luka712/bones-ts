import { Framework } from "../Framework";
import { BlurEffect } from "./BlurEffect";
import { GrayscaleEffect } from "./GrayscaleEffect";
import { TextureCombineEffect } from "./TextureCombineEffect";


export class EffectsFactory {
    constructor(private readonly m_framework: Framework) {

    }

    public async createGrayscaleEffect (): Promise<GrayscaleEffect> {
        const effect = new GrayscaleEffect(this.m_framework);
        await effect.initialize();
        return effect;
    }

    public async createTextureCombineEffect (): Promise<TextureCombineEffect> {

        const effect = new TextureCombineEffect(this.m_framework);
        await effect.initialize();
        return effect;
    }
    public async createBlurEffect (): Promise<BlurEffect> {
        const effect = new BlurEffect(this.m_framework);
        await effect.initialize();
        return effect;
    }
}