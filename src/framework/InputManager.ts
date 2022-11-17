// For ASCII codes see https://ascii.cl/ or https://www.libsdl.org/release/SDL-1.2.15/docs/html/sdlkey.html

import { pad } from "crypto-js";
import { workerData } from "worker_threads";
import { Vec2 } from "./bones_math";

export enum Keys
{
    ESCAPE = "Escape",
    ARROW_UP = "ArrowUp",
    ARROW_DOWN = "ArrowDown",
    ARROW_LEFT = "ArrowLeft",
    ARROW_RIGHT = "ArrowRight",
    ENTER = "Enter",
    BACKQUOTE = "`",
    TAB = "Tab",
};

class MouseState
{
    position: Vec2 = Vec2.zero();

    leftButtonDown: boolean;
    leftButtonUp: boolean;

    rightButtonDown: boolean;
    rightButtonUp: boolean;

    /**
     * @brief The mouse movement in x direction or change in x direction from previous frame.
     */
    deltaX: number;

    /**
     * @brief The mouse movement in y direction or change in y direction from previous frame.
     */
    deltaY: number;
}


/**
 * The D-Pad buttons.
 */
export enum DPadButtons 
{
    // order is important.
    Up = 1, Down = 2, Left = 4, Right = 8
}

/**
 * The face buttons.
 */
export enum FaceButtons 
{
    // order is important.
    A = 1, B = 2, X = 4, Y = 8, Select = 16, 
}

/**
 * The state of a gamepad.
 */
class GamepadState 
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
    public isFaceButtonUp(button: FaceButtons) : boolean 
    {
        return !this.isFaceButtonDown(button);
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
    private m_mouseState: MouseState;
    private m_gamepadState: Array<GamepadState>; // 0 to 3, for total of 4 controllers
    private m_onClickEvent: OnClickEvent;

    /**
     * Subscribers to on click event.
     */
    private m_onClickSubscribers: Array<(event: OnClickEvent) => void>;

    constructor(private readonly m_canvas: HTMLCanvasElement)
    {
        this.m_isKeyDown = {};
        this.m_mouseState = new MouseState();
        this.m_onClickEvent = new OnClickEvent();
        this.m_onClickSubscribers = [];
        this.m_gamepadState = [
            new GamepadState(),
            new GamepadState(),
            new GamepadState(),
            new GamepadState(),
        ]

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
        };

        m_canvas.onkeyup = (event) =>
        {
            this.m_isKeyDown[event.key] = false;
        };

        m_canvas.onmousemove = (event) =>
        {
            const rect = m_canvas.getBoundingClientRect();
            this.m_mouseState.position[0] = event.clientX - rect.left;
            this.m_mouseState.position[1] = event.clientY - rect.top;
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

        for (const key in this.m_isKeyDown)
        {
            this.m_isKeyDown[key] = false;
        }

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
     * Gets the mouse state.
     * @returns { MouseState }
     */
    public getMouseState (): MouseState
    {
        return this.m_mouseState;
    }

    /**
     * Gets the state of a gamepad.
     * @param { number } index 
     */
    public getGamepadState (index: number): GamepadState 
    {
        return this.m_gamepadState[index];
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

