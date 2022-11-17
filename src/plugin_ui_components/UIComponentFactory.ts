import { SpriteFont } from "../framework/fonts/SpriteFont";
import { Framework } from "../framework/Framework";
import { TextMenuComponent } from "./TextMenuComponent";


export class UIComponentFactory 
{
    /**
     * Constructs the ui component factory.
     * @param { Framework } m_framwork 
     */
    constructor(private m_framework: Framework)
    {

    }

    /**
     * Creates the text menu.
     * @param { SpriteFont | undefined } font - to use. 
     * @returns { TextMenuComponent}
     */
    public createTextMenu (font: SpriteFont = null)
    {
        return new TextMenuComponent(this.m_framework.input, this.m_framework.textRenderManager, font ?? this.m_framework.fontManager.defaultFont);
    }
}