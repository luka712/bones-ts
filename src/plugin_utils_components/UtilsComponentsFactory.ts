import { TimerComponent } from "./TimerComponent";

export class UtilsComponentsFactory 
{
    /**
     * Creates the timer component.
     * @param { ((TimerComponent) : void) } callback - the callback 
     * @param { number } notify_time - the nofify time in milliseconds, after which callback is called.
     * @returns { TimerComponent }
     */
    public createTimerComponent(callback: (timer: TimerComponent) => void, notify_time: number): TimerComponent 
    {
        return new TimerComponent(callback, notify_time);
    }
}