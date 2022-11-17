import { Framework } from "../Framework";

/**
 * Plugin to register.
 */
export abstract class FrameworkPlugin 
{
    /**
     * The setup method of a plugin. Should be called first.
     * Called when framework constructor is called.
     * 
     * @param { Framework } framework - the framework instance.
     * @return { void } 
     */
    public setup (framework: Framework): void 
    {

    }

    /**
     * The initialize method of a plugin. Called when framework initialize method is called.
     * @returns { Promise<void> }
     */
    public initialize (): Promise<void> 
    {
        return new Promise((resolve) => resolve());
    }

    /**
     * Updates the plugin. Called when framework update method is called.
     * @param { number } delta_time 
     */
    public update (delta_time: number): void 
    {

    }

    /**
     * Draws the plugin. Called when framework draw method is called.
     */
    public draw (): void 
    {

    }
}