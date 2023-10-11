import { Framework, FrameworkOptions } from "./framework/Framework";
import { Vec3 } from "./framework/math/vec/Vec3";
import {  SpriteRenderer } from "./framework/sprite/SpriteRenderer";
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
import { Physics2D } from "./framework/physics/euler/Physics2D";
import { CircleCollider2D } from "./framework/collision/CircleCollider2D";
import { Physics2DVerlet } from './framework/physics/verlet/Physics2DVerlet';
import { PhysicsBoundsBehavior } from "./framework/physics/common/PhysicsBoundsBehavior";
import { FreeCamera } from "./framework/camera/FreeCamera";
import { Texture2D } from "./framework/textures/Texture2D";
import { TextureManager } from "./framework/textures/TextureManager";

export
{
    Framework,

    // components
    SpriteRenderer, InputManager,
    TimeManager,
    PostProcessPipelineFactory as PipelineFactory, Keys,
    GamePadIndex,
    DPadButtons,
    FaceButtons,

    // tex releated data
    Texture2D,
    TextureManager,

    // math related data
    Rect,
    Vec2,
    Vec3,
    Mat4x4,
    Color,
    Quaternion,
    MathUtil,


    // time manager data
    Time,

    // post process data
    PostProcessPipeline,

    // Physics
    Physics2D,
    Physics2DVerlet,
    PhysicsBoundsBehavior,

    // Colliders
    CircleCollider2D,

    // Camera
    FreeCamera,

    // test scene/games.
    // TestGame, 
    // WebGPUTestGame,
    // PLUGINS - todo, plugins should not be part of an engine, refactor later.
};
export type {
    // Framework 
    FrameworkOptions,

    // input manager data
    KeyboardState,
    MouseState,
    GamePadState, 
};
