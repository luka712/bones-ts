import { Vec2 } from "../bones_math";
import { DPadButtons, FaceButtons, Keys } from "./InputManagerEnums";

/**
 * The keyboard state.
 */
export interface KeyboardState 
{
    /**
    * Checks if key of keyboard state is down.
    * @param key - the key {@link Keys}
    * @returns true if down.
    */
    isKeyDown (key: Keys | string): boolean;

    /**
     * Checks if key is up.
     * @param key - the key {@link Keys}
     * @returns true if up.
     */
    isKeyUp (key: Keys | string): boolean;
}


/**
 * The mouse state.
 */
export interface MouseState
{
    /**
     * The mouse position.
     */
    readonly position: Vec2;

    readonly leftButtonDown: boolean;
    readonly leftButtonUp: boolean;

    readonly rightButtonDown: boolean;
    readonly rightButtonUp: boolean;

    /**
     * @brief The mouse movement in x direction or change in x direction from previous frame.
     */
    readonly deltaX: number;

    /**
     * @brief The mouse movement in y direction or change in y direction from previous frame.
     */
    readonly deltaY: number;
}


/**
 * The state of a gamepad.
 */
export interface GamePadState 
{
    /**
     * Is gamepad connected.
     */
    readonly connected: boolean ;

    /**
     * The motion of left axis.
     */
    readonly leftAxisMotion: Vec2;

    /**
     * The motion of right axis.
     */
    readonly rightAxisMotion: Vec2;

    /**
     * The pressed D-Pad buttons.
     */
    readonly pressedDPadButtons: DPadButtons ;

    /**
     * Checks if D-Pad button is down.
     * @param { DPadButtons } button  - button or buttons if passed with |. Example DPadButtons.Down w DPadButtons.Up 
     */
    isDPadButtonDown (button: DPadButtons): boolean;
    /**
     * The state of face buttons.
     */
    readonly pressedFaceButtons: FaceButtons ;

    /**
     * Checks if face button is down.
     * @param { FaceButtons } button - button or buttons if passed with |. Example FaceButtons.Down | FaceButtons.Up 
     * @returns { boolean }
     */
    isFaceButtonDown (button: FaceButtons): boolean;

    /**
     * Checks if face button is up.
     * @param { FaceButtons } button - button or buttons if passed with |. Example FaceButtons.Down | FaceButtons.Up 
     * @returns { boolean }
     */
    isFaceButtonUp (button: FaceButtons): boolean;
}