
/**
 * The keys.
 */
export enum Keys
{
    ESCAPE = "Escape",
    ARROW_UP = "ArrowUp",
    ARROW_DOWN = "ArrowDown",
    ARROW_LEFT = "ArrowLeft",
    ARROW_RIGHT = "ArrowRight",
    ENTER = "Enter",
    SPACE = "Space",
    BACKQUOTE = "`",
    TAB = "Tab",
    A = "A",
    a = "a",
    S = "S",
    s = "s",
    D = "D",
    d = "d",
    W = "W",
    w = "w"
};


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

 export enum Triggers 
 {
    // TODO:
    Left = 0,
    Right = 1
 }

 /**
  * The gamepad index.
  */
 export enum GamePadIndex 
 {
    One = 0,
    Two = 1,
    Three = 2,
    Four = 3
 }
 