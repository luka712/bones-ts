import { Framework } from "./framework/Framework";
import { Texture2D, TextureManager } from "./framework/bones_texture";
import { Vec3 } from "./framework/math/vec/Vec3";
import { Blend, BlendFactor, SpriteRenderer } from "./framework/SpriteRenderer";
import { InputManager } from "./framework/input/InputManager";
import { GamePadState, KeyboardState, MouseState } from "./framework/input/InputStates";
import { DPadButtons, FaceButtons, GamePadIndex, Keys } from "./framework/input/InputManagerEnums";
import { Quaternion } from "./framework/math/quaternion/Quaternion";
import { MathUtil } from "./framework/math/MathUtil";
import { Color } from "./framework/math/Color";
import { Mat4x4 } from "./framework/math/mat/Mat4x4";
import { Rect } from "./framework/math/Rect";
import { Vec2 } from "./framework/math/vec/Vec2";
import { Time, TimeManager } from "./framework/bones_time";
import { PostProcessPipelineFactory } from "./framework/post_process/pipelines/PostProcessPipelineFactory";
import { PostProcessPipeline } from "./framework/post_process/pipelines/PostProcessPipeline";

export 
{
    Framework,
    
    // components
    SpriteRenderer,
    TextureManager,
    InputManager,
    TimeManager,
    PostProcessPipelineFactory as PipelineFactory,

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
    MathUtil,

    // sprite renderer data
    Blend,
    BlendFactor,

    // time manager data
    Time, 

    // post process data
    PostProcessPipeline,

    // test scene/games.
    // TestGame, 
    // WebGPUTestGame,
}