// For ASCII codes see https://ascii.cl/ or https://www.libsdl.org/release/SDL-1.2.15/docs/html/sdlkey.html

import { Vec2 } from "../bones_math";
import { DPadButtons, FaceButtons, GamePadIndex, Keys } from "./InputManagerEnums";
import { GamePadState, KeyboardState, MouseState } from "./InputStates";


/**
 * The keyboard state.
 */
class KeyboardStateImplementation implements KeyboardState
{
    protected m_isKeyDown: { [id: Keys | string]: boolean } = {};

    constructor()
    { }


    /**
     * Sets the key to true.
     * @param key 
     */
    public setKeyDown (key: Keys | string): void 
    {
        this.m_isKeyDown[key] = true;
    }

    /**
     * Sets the key to false.
     * @param key 
     */
    public setKeyUp (key: Keys | string): void 
    {
        this.m_isKeyDown[key] = false;
    }


    /**
     * Check if key is up.
     * @param key 
     */
    public isKeyUp (key: Keys | string): boolean
    {
        return !this.isKeyDown(key);
    }

    /**
     * Checks if key of keyboard state is down.
     * @param key - the key {@see Keys}
     * @returns 
     */
    public isKeyDown (key: Keys | string): boolean 
    {
        return this.m_isKeyDown[key] === true;
    }

    /**
     * Creates a copy of a keyboard state.
     * @param keyboard_state 
     */
    public static copy (keyboard_state: KeyboardStateImplementation): KeyboardState 
    {
        const instance = new KeyboardStateImplementation();
        Object.assign(instance, keyboard_state);
        return instance;
    }
}

class MouseStateImplementation implements MouseState 
{
    /**
     * The mouse position.
     */
    position: Vec2 = Vec2.zero();
    leftButtonDown: boolean;
    leftButtonUp: boolean;
    rightButtonDown: boolean;
    rightButtonUp: boolean;
    deltaX: number;
    deltaY: number;


    /**
     * Creates a copy of a mouse state.
     * @param mouse_state 
     */
    public static copy (mouse_state: MouseStateImplementation): MouseState 
    {
        const instance = new MouseStateImplementation();
        Object.assign(instance, mouse_state);
        // needs to be copied.
        instance.position = new Vec2(mouse_state.position.x, mouse_state.position.y);
        return instance;
    }
}


/**
 * The state of a gamepad.
 */
export class GamePadStateImplementation implements GamePadState
{
    /**
     * Is gamepad connected.
     */
    public connected: boolean = false;

    /**
     * The motion of left axis.
     */
    public leftAxisMotion: Vec2 = Vec2.zero();

    /**
     * The motion of right axis.
     */
    public rightAxisMotion: Vec2 = Vec2.zero();

    /**
     * The pressed D-Pad buttons.
     */
    public pressedDPadButtons: DPadButtons = 0;

    /**
     * Checks if D-Pad button is down.
     * @param { DPadButtons } button  - button or buttons if passed with |. Example DPadButtons.Down w DPadButtons.Up 
     */
    public isDPadButtonDown (button: DPadButtons): boolean 
    {
        return (this.pressedDPadButtons & button) > 0;
    }

    /**
     * The state of face buttons.
     */
    public pressedFaceButtons: FaceButtons = 0;

    /**
     * Checks if face button is down.
     * @param { FaceButtons } button - button or buttons if passed with |. Example FaceButtons.Down | FaceButtons.Up 
     * @returns { boolean }
     */
    public isFaceButtonDown (button: FaceButtons): boolean
    {
        return (this.pressedFaceButtons & button) > 0;
    }

    /**
     * Checks if face button is up.
     * @param { FaceButtons } button - button or buttons if passed with |. Example FaceButtons.Down | FaceButtons.Up 
     * @returns { boolean }
     */
    public isFaceButtonUp (button: FaceButtons): boolean 
    {
        return !this.isFaceButtonDown(button);
    }

    /**
    * Creates a copy of a mouse state.
    * @param game_pad_state 
    */
    public static copy (game_pad_state: GamePadStateImplementation): GamePadState 
    {
        const instance = new GamePadStateImplementation();
        Object.assign(instance, game_pad_state);
        return instance;
    }
}



/**
 * @brief OnClick event.
 * 
 */
class OnClickEvent
{
    leftClick: boolean;
    rightClick: boolean
};


/**
 * The input manager.
 */
export class InputManager
{
    private m_isKeyDown: { [id: number]: boolean };

    private m_keyboardState: KeyboardStateImplementation = new KeyboardStateImplementation();
    private m_mouseState: MouseStateImplementation = new MouseStateImplementation();
    private m_gamepadState: Array<GamePadStateImplementation> = [
        new GamePadStateImplementation(),
        new GamePadStateImplementation(),
        new GamePadStateImplementation(),
        new GamePadStateImplementation(),
    ]; // 0 to 3, for total of 4 controllers

    private m_onClickEvent: OnClickEvent;

    /**
     * Subscribers to on click event.
     */
    private m_onClickSubscribers: Array<(event: OnClickEvent) => void>;

    constructor(private readonly m_canvas: HTMLCanvasElement)
    {
        this.m_isKeyDown = {};
        this.m_onClickEvent = new OnClickEvent();
        this.m_onClickSubscribers = [];

        // https://stackoverflow.com/questions/15631991/how-to-register-onkeydown-event-for-html5-canvas
        this.m_canvas.tabIndex = 1000;

        m_canvas.onclick = (event) =>
        {
            this.m_mouseState.leftButtonDown = event.button == 0;
            this.m_mouseState.leftButtonUp = !this.m_mouseState.leftButtonDown;

            this.m_mouseState.rightButtonDown = event.button == 1;
            this.m_mouseState.rightButtonDown = !this.m_mouseState.rightButtonDown;

            this.m_onClickEvent.leftClick = this.m_mouseState.leftButtonDown;
            this.m_onClickEvent.rightClick = this.m_mouseState.rightButtonDown;

            this.m_onClickSubscribers.forEach(x => x(this.m_onClickEvent));

        };

        m_canvas.onkeydown = (event) =>
        {
            this.m_isKeyDown[event.key] = true;
            this.m_keyboardState.setKeyDown(event.key);
        };

        m_canvas.onkeyup = (event) =>
        {
            this.m_isKeyDown[event.key] = false;
            this.m_keyboardState.setKeyUp(event.key);
        };

        m_canvas.onmousemove = (event) =>
        {
            const rect = m_canvas.getBoundingClientRect();
            this.m_mouseState.position.x = event.clientX - rect.left;
            this.m_mouseState.position.y = event.clientY - rect.top;
            this.m_mouseState.deltaX = event.movementX;
            this.m_mouseState.deltaY = event.movementY;
        }

        window.addEventListener("gamepadconnected", (e: GamepadEvent) => 
        {
            const i = e.gamepad.index;
            this.m_gamepadState[i].connected = true;
        });

        window.addEventListener("gamepaddisconnected", (e: GamepadEvent) => 
        {
            const i = e.gamepad.index;
            this.m_gamepadState[i].connected = false;
        });
    }

    /**
     * The update method.
     */
    public update (): void
    {
        // handle gamepads.
        for (let i = 0; i < 3; i++)
        {
            // get gamepad.
            const gamepad = navigator.getGamepads()[i];

            // if not connected, just continue.
            if (!gamepad)
            {
                this.m_gamepadState[i].connected = false;
                continue;
            }

            const pad_state = this.m_gamepadState[i];
            pad_state.connected = true;

            // https://gabrielromualdo.com/articles/2020-12-15-how-to-use-the-html5-gamepad-api

            // face-buttons, X = 0, Y = 1, A = 2, B = 3, Select = 4
            pad_state.pressedFaceButtons |= (gamepad.buttons[0].pressed ? 1 : 0) << 0;
            pad_state.pressedFaceButtons |= (gamepad.buttons[1].pressed ? 1 : 0) << 1;
            pad_state.pressedFaceButtons |= (gamepad.buttons[2].pressed ? 1 : 0) << 2;
            pad_state.pressedFaceButtons |= (gamepad.buttons[3].pressed ? 1 : 0) << 3;
            pad_state.pressedFaceButtons |= (gamepad.buttons[9].pressed ? 1 : 0) << 4;

            // d-pad  Up = 0, Down = 1, Left = 2, Right = 3
            pad_state.pressedDPadButtons |= (gamepad.buttons[12].pressed ? 1 : 0) << 0;
            pad_state.pressedDPadButtons |= (gamepad.buttons[13].pressed ? 1 : 0) << 1;
            pad_state.pressedDPadButtons |= (gamepad.buttons[14].pressed ? 1 : 0) << 2;
            pad_state.pressedDPadButtons |= (gamepad.buttons[15].pressed ? 1 : 0) << 3;

            // axis https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
            pad_state.leftAxisMotion[0] = gamepad.axes[0];
            pad_state.leftAxisMotion[1] = gamepad.axes[1];
            pad_state.rightAxisMotion[1] = gamepad.axes[2];
            pad_state.rightAxisMotion[1] = gamepad.axes[3];

        }
    }

    /**
     * After update. Used mainly to clean up states of keyboard, mouse, gamepad.
     */
    public afterUpdate (): void
    {
        this.m_mouseState.leftButtonDown = false;
        this.m_mouseState.leftButtonUp = !this.m_mouseState.leftButtonDown;

        this.m_mouseState.rightButtonDown = false;
        this.m_mouseState.rightButtonUp = !this.m_mouseState.rightButtonDown;

        this.m_mouseState.deltaX = 0;
        this.m_mouseState.deltaY = 0;

        // TODO: probably not necessary, since there is key up!
        // for (const key in this.m_isKeyDown)
        // {
        //     this.m_isKeyDown[key] = false;
        // }

        for (let i = 0; i < 3; i++)
        {
            const gamepad = this.m_gamepadState[i];
            if (gamepad.connected)
            {
                gamepad.pressedDPadButtons = 0;
                gamepad.pressedFaceButtons = 0;
            }
        }
    }

    /**
     * @brief Checks if key is down. Returns true if pressed.
     *
     * @param { Keys } key
     * @return { boolean }  - true if pressed, false otherwise.
     */
    public isKeyDown (key: Keys): boolean
    {
        return this.m_isKeyDown[key] === true;
    }

    /**
     * @brief Checks if key is up. Returns true if not pressed.
     *
     * @param { Keys } key
    * @return { boolean }  - true if not pressed, false otherwise.
     */
    public isKeyUp (key: Keys): boolean
    {
        return this.isKeyDown(key) === false;
    }

    /**
     * Gets the keyboard state.
     */
    public getKeyboardState (): KeyboardState 
    {
        return this.m_keyboardState;
    }

    /**
     * Gets the copy of a keyboard state. 
     * Useful when keyboard state needs to be unique between frames.
     * @returns 
     */
    public getKeyboardStateCopy (): KeyboardState 
    {
        return KeyboardStateImplementation.copy(this.m_keyboardState);
    }

    /**
     * Gets the mouse state.
     * @returns { MouseState }
     */
    public getMouseState (): MouseState
    {
        return this.m_mouseState;
    }

    /**
    * Gets the mouse state.
    * Useful when keyboard state needs to be unique between frames.
    * @returns { MouseState }
    */
    public getMouseStateCopy (): MouseState
    {
        return MouseStateImplementation.copy(this.m_mouseState);
    }

    /**
     * Gets the state of a gamepad.
     * @param index {@link GamePadIndex} 
     */
    public getGamepadState (index: GamePadIndex | number): GamePadState 
    {
        return this.m_gamepadState[index];
    }

    /**
    * Gets the state of a gamepad.
    * Useful when keyboard state needs to be unique between frames.
    * @param index {@link GamePadIndex} 
    */
    public getGamepadStateCopy (index: GamePadIndex | number): GamePadState 
    {
        return GamePadStateImplementation.copy(this.m_gamepadState[index]);
    }

    /**
     * @brief Subscribe to OnMouseClicked event.
     * 
     * @param { (OnClickEvent) => void } on_click - callback
     */
    public subscribeToOnMouseClicked (on_click: (event: OnClickEvent) => void): void
    {
        this.m_onClickSubscribers.push(on_click);
    }
}

