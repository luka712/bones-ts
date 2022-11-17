import { Framework } from "../framework/Framework";
import { FrameworkPlugin } from "../framework/plugin/FrameworkPlugin";
import { UtilsComponentsFactory } from "./UtilsComponentsFactory";

export class UtilsPlugin extends FrameworkPlugin 
{
    /**
     * Gets the utils.
     */
    public utils: UtilsComponentsFactory;

    public setup (framework: Framework): void
    {
        this.utils = new UtilsComponentsFactory();
    }
    
}