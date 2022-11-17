import { Framework } from "../framework/Framework";
import { FrameworkPlugin } from "../framework/plugin/FrameworkPlugin";
import { UIComponentFactory } from "./UIComponentFactory";

/**
 * The ui components plugin.
 */
export class UIComponentsPlugin extends FrameworkPlugin 
{
    /**
     * The component factory.
     */
    public ui: UIComponentFactory;

    /**
     * The setup method.
     * @param { Framework } framework 
     */
    public setup (framework: Framework): void
    {
        this.ui = new UIComponentFactory(framework);
    }
}