import { Framework } from "./framework/Framework";
import { Color, Mat4x4, randomFloat, randomInt, Rect, Vec2 } from "./framework/bones_math";
import { TestGame } from "./test/TestGame";
import { WebGPUTestGame } from "./test/WebGPUTestGame";
import { Texture2D, TextureManager } from "./framework/bones_texture";
import { Vec3 } from "./framework/math/vec/Vec3";
import { Blend, BlendFactor, SpriteRenderer } from "./framework/SpriteRenderer";
import { InputManager } from "./framework/input/InputManager";
import { GamePadState, KeyboardState, MouseState } from "./framework/input/InputStates";
import { DPadButtons, FaceButtons, GamePadIndex, Keys } from "./framework/input/InputManagerEnums";
import { Quaternion } from "./framework/math/quaternion/Quaternion";

export 
{
    Framework,
    
    // components
    SpriteRenderer,
    TextureManager,
    InputManager,

    // input manager data
    KeyboardState,
    MouseState,
    GamePadState,
    Keys,
    GamePadIndex,
    DPadButtons,
    FaceButtons,
    
    // tex releated data
    Texture2D,

    // math related data
    Rect,
    Vec2,
    Vec3,
    Mat4x4,
    Color,
    Quaternion,
    randomFloat,
    randomInt,

    // sprite renderer data
    Blend,
    BlendFactor


    // test scene/games.
    // TestGame, 
    // WebGPUTestGame,
}