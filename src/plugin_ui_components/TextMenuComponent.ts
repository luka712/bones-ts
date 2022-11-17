import { TimerComponent } from "../plugin_utils_components/TimerComponent";
import { LifecycleState } from "../framework/bones_common";
import { Vec2, Rect, Color } from "../framework/bones_math";
import { SpriteFont, FontCharacter, FontType } from "../framework/fonts/SpriteFont";
import { Keys, FaceButtons, InputManager, DPadButtons } from "../framework/InputManager";
import { Sound } from "../framework/sounds/Sound";
import { TextRenderManager } from "../framework/TextRenderer";


/**
 * Menu entry selected event.
 */
class MenuEntrySelectedEvent
{
    public entry: string;
}


/**
 * @brief What is the state of menu entry.
 */
enum MenuComponentMenuState
{
    Closed,
    Open,
    SubmenuOpen,
    ParentOpen
};

/**
 * @brief The configurable behaviour for each entry.
 */
enum MenuComponentBehaviour
{
    /**
     * @brief By default, on selection, if menu has children, navigates to submenus.
     */
    Default,

    /**
     * @brief When clicked goes back to previous menu, if it has one.
     */
    GoBack,


    /**
     * @brief Does nothing, just exists. Use cases would be, for example credits section.
     */
    Noninteractive
};


// STATE
// * Closed -> no menu is open
// * Open -> main menu is open, or child is open.
// * SubmenuOpen -> if submenu is open, child is set to open caller to SubmenuOpen
// * ParentOpen -> if child menu is open, parent must be set to ParentOpen

// BEHAVIOUR
// * Default -> see STATE
// * GoBack -> if parent is available, navigates to parent.
// * Noninteractive -> element cannot be selected nor it is shown as such. 

// NOTE: this component is rather large and might need refactoring later down the road
// To keep it in check, variables might have s_ or m_ prefix
// s_ is state prefix, it's responsible for keeping track of states withing component, for example mouse was clicked
// m_ is for member variable, usually those are private variables that are suposed to be changed by caller of class instance. 
// for example m_drawingOffset which is offset that can be set by caller/user of class. While state variables are never to be exposed.

/**
 * The menu component.
 */
export class TextMenuComponent 
{
    /**
     * The position. This is just cache value.
     */
    private o_positionValCache: Vec2;

    /**
     * @brief 0 for keyboard, 1 for mouse. -1 for no input so far.
     */
    private o_lastInput: number;

    /**
     * @brief if left click was registered. This will be only set for parent.
     */
    private m_leftClick: boolean;


    /**
     * @brief The currently selected menu entry.
     */
    private s_selectedIndex: number;

    /**
     * The lifecycle state.
     */
    private __state: LifecycleState;

    /**
     * @brief Which key can be used to select. By default set to Keys.ENTER.
     */
    private m_selectKey: Keys = Keys.ENTER;

    /**
     * @brief Which gamepad can be used to select. By default set FaceButtons.A
     */
    private m_selectButton: FaceButtons = FaceButtons.A;

    /**
     * @brief The key to move back to parent menu.
     */
    private m_moveToParentMenuKey: Keys = Keys.ESCAPE;

    /**
     * The gamepad button to move back to parent menu.
     */
    private m_moveToParentMenuButton: FaceButtons = FaceButtons.B;

    /**
     * The mouse rectangle.
     */
    private __mouseRect: Rect;

    /**
     * @brief What is the state of a menu.
     * Use GetComponentState to get a state.
     * Use SetComponentState to set a state.
     */
    private m_componentState: MenuComponentMenuState;

    private m_fontScale: number;

    private m_clickSound?: Sound;

    /**
     * The drawing offset.
     */
    private m_drawingOffset: Vec2;

    /**
     * @brief Children of menu component.
     */
    private m_children: Array<TextMenuComponent>;

    /**
     * Timer between key and button presses. It has 100ms timeout, so that menu is controlled when opening/going back etc...
     */
    private m_buttonKeyPressTimer: TimerComponent;

    /**
     * @brief What is behaviour of the menu.
     */
    public behaviour: MenuComponentBehaviour = MenuComponentBehaviour.Default;

    /**
     * @brief Color of a font.
     */
    public textColor: Color;

    /**
     * @brief Color to be used for font when select is over.
     */
    public selectionColor: Color;


    /**
     * @brief Draw position rectangle.
     */
    public drawRect: Rect;

    /**
     * The child collision rectangle.
     */
    public collisionRect: Rect;

    /**
     * @brief Construct a new Menu Component object
     *
     * @param { InputManager } input_manager - the input manager.
     * @param { TextRenderManager } text_manager - the text manager.
     * @param { SpriteFont } font - font to use.
     * @param { string | null } entry - the text that will be used when entry is shown.
     * @param { ((MenuEntrySelectedEvent) => void) | null} on_menu_entry_selected - callback on selection.
     * @param { TextMenuComponent | null } parent - set if menu entry is child entry.
     */
    constructor(private readonly m_inputManager: InputManager,
        private readonly m_textManager: TextRenderManager,
        private m_font: SpriteFont,
        public text: string = null,
        private readonly m_onSelected: (MenuEntrySelectedEvent) => void = null,
        private readonly m_parent: TextMenuComponent = null)
    {
        this.__state = LifecycleState.Created;
        this.textColor = Color.white();
        this.selectionColor = Color.yellow();

        this.m_drawingOffset = Vec2.zero();
        this.m_fontScale = 1.0;

        this.m_children = [];

        this.o_positionValCache = Vec2.zero();

        this.drawRect = new Rect();
        this.collisionRect = new Rect();

        this.m_componentState = MenuComponentMenuState.Closed;

        this.o_lastInput = -1;
        this.s_selectedIndex = 0;
        this.m_leftClick = false;

        this.m_buttonKeyPressTimer = new TimerComponent(null, 150);
        this.m_buttonKeyPressTimer.start();

        this.__mouseRect = new Rect();
    }

    /**
     * Gets the font.
     * @return { SpriteFont }
     */
    public get font (): SpriteFont 
    {
        return this.m_font;
    }

    /**
     * Sets the font.
     */
    public set font (v: SpriteFont) 
    {
        this.m_font = v;
        if (!this.m_children) return;
        for (const child of this.m_children)
        {
            child.font = v;
        }
    }

    /**
     * Gets the font scale.
     */
    public get fontScale (): number 
    {
        return this.m_fontScale;
    }

    /**
     * Sets the font scale.
     */
    public set fontScale (val: number)
    {
        this.m_fontScale = val;
        if (!this.m_children) return;

        for (const child of this.m_children)
        {
            child.fontScale = val;
        }
    }

    /**
     * Sets the click sound, if any.
     */
    public set clickSound(val: Sound | null)
    {
        this.m_clickSound = val;
        for(const child of this.m_children)
        {
            child.clickSound = val;
        }
    }

    /**
     * Gets the drawing offset.
     * 
     * @returns { Vec2 }
     */
    public getDrawingOffset (): Vec2 
    {
        return this.m_drawingOffset;
    }

    /**
     * Set the drawing offset. It will offset menu from center for number of pixels passed in.
     * @param { Vec2 } v 
     */
    public setDrawingOffset (v: Vec2) 
    {
        this.m_drawingOffset = v;
        for (const child of this.m_children)
        {
            child.setDrawingOffset(v);
        }
    }

    /**
     * Is menu currently closed.
     */
    public get isClosed (): boolean
    {
        return this.m_componentState == MenuComponentMenuState.Closed;
    }

    /**
     * Is menu currently open.
     */
    public get isOpen (): boolean 
    {
        return !this.isClosed;
    }

    /**
      * @brief Get the Component State object.
      *
      * @return { MenuComponentMenuState }
      */
    public get componentState (): MenuComponentMenuState { return this.m_componentState; }

    /**
     * @brief Set the Component State object
     *
     * @param { MenuComponentMenuState } state_val
     */
    public set componentState (v: MenuComponentMenuState)
    {
        this.m_componentState = v;
        // Clear variables here.
        this.o_lastInput = -1;
        this.m_buttonKeyPressTimer.restart();
        this.m_leftClick = false;
    }


    /**
     * @brief Setup draw and collision rects from child elements, if there are any.
     *
     * @return { void }
     */
    private setupDrawAndCollisionRects (): void 
    {
        if (this.m_children.length == 0)
            return;

        // can be executed only if active.
        const width = this.m_textManager.renderer.bufferWidth;
        const height = this.m_textManager.renderer.bufferHeight;

        // by default, menu is vertical, draw from middle of screen. Margin is 10 by default.
        const margin = 10;
        const children_size = this.m_children.length;
        const font_size = this.m_font.fontSize * this.m_fontScale;
        const total_menu_height = children_size * font_size + children_size * margin;

        // start at half height - total half height of menu
        let pos_y = height / 2 - total_menu_height / 2;
        // now add offset
        pos_y += this.m_drawingOffset[1];

        let rect_x = 0;
        let rect_y = 0;
        const rect_h = font_size;

        for (let i = 0; i < children_size; i++)
        {
            let x = 0;
            const child = this.m_children[i];

            // width of rectangle.
            let rect_w = 0;

            // set rect pos
            rect_y = pos_y;

            // set rect w
            const count = child.text.length;

            let ch: FontCharacter | null = null;

            // Don't really care about last char, when it comes to width.
            for (let i = 0; i < count; i++)
            {
                ch = this.m_font.getFontCharacterInfo(child.text[i]);

                // now advance cursors for next glyph (note that advance is number of 1/64 pixels)
                if (this.m_font.fontType == FontType.GlyphCharFont)
                {
                    x = ch.size[0];
                    rect_w += x * this.m_fontScale;
                }
                else if (this.m_font.fontType == FontType.BitmapFont)
                {
                    x = ch.advance[0];
                    rect_w += x * this.m_fontScale;
                }
            }


            // set rect pos x
            rect_x = width / 2 - rect_w / 2;
            // now add offset
            rect_x += this.m_drawingOffset[0];

            // Deduce for last bearing.
            // TODO: rought estimate, fix this in future.
            // rect_w = rect_w - x / 2;

            child.drawRect.x = rect_x;
            child.drawRect.y = rect_y;
            child.drawRect.w = rect_w;
            child.drawRect.h = rect_h;
            child.collisionRect.x = rect_x;
            child.collisionRect.y = rect_y;
            child.collisionRect.w = rect_w;
            child.collisionRect.h = rect_h;

            // advance position and index.
            pos_y += font_size + margin;

            child.setupDrawAndCollisionRects();
        }
    }

    private handleGamePad (): void 
    {
        const game_pad = this.m_inputManager.getGamepadState(0);

        // action can be only take after certain timeout.
        const can_take_action = this.m_buttonKeyPressTimer.timeExpired;

        if (!game_pad.connected || !can_take_action) return;

        if (game_pad.isFaceButtonDown(this.m_moveToParentMenuButton))
        {
            this.m_buttonKeyPressTimer.restart();

            const is_main_menu = !this.m_parent;

            if (is_main_menu)
            {
                if (this.m_componentState == MenuComponentMenuState.Closed && !this.m_parent)
                {
                    this.open();
                }
                else if (this.m_componentState == MenuComponentMenuState.Open && !this.m_parent)
                {
                    this.close();
                }
            }
            // is a submenu
            else 
            {
                if (this.m_componentState == MenuComponentMenuState.Open)
                {
                    this.s_selectedIndex = 0;
                    this.m_parent.open();
                }
            }
        }

        // if closed, no need to update submenus either.
        if (this.m_componentState == MenuComponentMenuState.Closed)
            return;

        // only update self if open.
        if (this.m_componentState != MenuComponentMenuState.Open)
            return;

        // if selected.
        if (game_pad.isFaceButtonDown(this.m_selectButton))
        {
            this.m_buttonKeyPressTimer.restart();

            if (this.s_selectedIndex >= 0)
            {
                const child = this.m_children[this.s_selectedIndex];

                // create event args and fire off event.
                const args = new MenuEntrySelectedEvent();
                args.entry = child.text;

                // fire off if exists
                if (child.m_onSelected)
                {
                    child.m_onSelected(args);
                }

                // open only if it has submenu
                if (child.behaviour == MenuComponentBehaviour.Default && child.m_children.length > 0)
                {
                    child.open();
                }
                else if (child.behaviour == MenuComponentBehaviour.GoBack && this.m_parent)
                {
                    this.m_parent.open();
                }
            }
        }
        // move down menu
        else if (game_pad.isDPadButtonDown(DPadButtons.Down))
        {
            this.m_buttonKeyPressTimer.restart();

            // last input 0, last input was keyboard or gamepad.
            this.o_lastInput = 0;
            this.s_selectedIndex++;

            // check if there is any interactive entry ( usually there is, this is just to handle non interactive ones )
            let has_interactive = false;
            for (let i = 0; i < this.m_children.length; i++)
            {
                if (this.m_children[i].behaviour != MenuComponentBehaviour.Noninteractive)
                {
                    has_interactive = true;
                    break;
                }
            }

            // reset index if above all entries.
            if (this.s_selectedIndex >= this.m_children.length)
            {
                this.s_selectedIndex = 0;
            }

            // if by any chance, child index is non_interactive, skip it.
            while (has_interactive && this.m_children[this.s_selectedIndex].behaviour == MenuComponentBehaviour.Noninteractive)
            {
                this.s_selectedIndex++;
                if (this.s_selectedIndex >= this.m_children.length)
                {
                    this.s_selectedIndex = 0;
                }
            }
        }
        // move up menu
        else if (game_pad.isDPadButtonDown(DPadButtons.Up))
        {
            this.m_buttonKeyPressTimer.restart();

            // last input 0, last input was keyboard.
            this.o_lastInput = 0;
            this.s_selectedIndex--;

            // check if there is any interactive entry ( usually there is, this is just to handle non interactive ones )
            let has_interactive = false;
            for (let i = 0; i < this.m_children.length; i++)
            {
                if (this.m_children[i].behaviour != MenuComponentBehaviour.Noninteractive)
                {
                    has_interactive = true;
                    break;
                }
            }

            if (this.s_selectedIndex < 0)
            {
                this.s_selectedIndex = this.m_children.length - 1;
            }

            // if by any chance, child index is non_interactive, skip it.
            while (has_interactive && this.m_children[this.s_selectedIndex].behaviour == MenuComponentBehaviour.Noninteractive)
            {
                this.s_selectedIndex--;
                if (this.s_selectedIndex < 0)
                {
                    this.s_selectedIndex = this.m_children.length - 1;
                }
            }
        }
    }

    /**
     * Handles key input
     * @returns { void }
     */
    private handleKeyInput (): void 
    {
        // action can be only take after certain timeout.
        const can_take_action = this.m_buttonKeyPressTimer.timeExpired;
        if (!can_take_action) return;

        if (this.m_inputManager.isKeyDown(this.m_moveToParentMenuKey))
        {
            const is_main_menu = !this.m_parent;

            if (is_main_menu)
            {
                if (this.m_componentState == MenuComponentMenuState.Closed && !this.m_parent)
                {
                    this.open();
                }
                else if (this.m_componentState == MenuComponentMenuState.Open && !this.m_parent)
                {
                    this.close();
                }
            }
            // is a submenu
            else 
            {
                if (this.m_componentState == MenuComponentMenuState.Open)
                {
                    this.s_selectedIndex = 0;
                    this.m_parent.open();
                }
            }
        }

        // if closed, no need to update submenus either.
        if (this.m_componentState == MenuComponentMenuState.Closed)
            return;


        // only update self if open.
        if (this.m_componentState != MenuComponentMenuState.Open)
            return;

        // if selected.
        if (this.m_inputManager.isKeyDown(this.m_selectKey))
        {
            if (this.s_selectedIndex >= 0)
            {
                const child = this.m_children[this.s_selectedIndex];

                // create event args and fire off event.
                const args = new MenuEntrySelectedEvent();
                args.entry = child.text;

                // fire off if exists
                if (child.m_onSelected)
                {
                    child.m_onSelected(args);
                }

                // open only if it has submenu
                if (child.behaviour == MenuComponentBehaviour.Default && child.m_children.length > 0)
                {
                    child.open();
                }
                else if (child.behaviour == MenuComponentBehaviour.GoBack && this.m_parent)
                {
                    this.m_parent.open();
                }
            }
        }
        // move down menu
        else if ( this.m_inputManager.isKeyDown(Keys.ARROW_DOWN))
        {
            // last input 0, last input was keyboard.
            this.o_lastInput = 0;
            this.s_selectedIndex++;

            // check if there is any interactive entry ( usually there is, this is just to handle non interactive ones )
            let has_interactive = false;
            for (let i = 0; i < this.m_children.length; i++)
            {
                if (this.m_children[i].behaviour != MenuComponentBehaviour.Noninteractive)
                {
                    has_interactive = true;
                    break;
                }
            }

            // reset index if above all entries.
            if (this.s_selectedIndex >= this.m_children.length)
            {
                this.s_selectedIndex = 0;
            }


            // if by any chance, child index is non_interactive, skip it.
            while (has_interactive && this.m_children[this.s_selectedIndex].behaviour == MenuComponentBehaviour.Noninteractive)
            {
                this.s_selectedIndex++;
                if (this.s_selectedIndex >= this.m_children.length)
                {
                    this.s_selectedIndex = 0;
                }
            }
        }
        // move up menu
        else if (this.m_inputManager.isKeyDown(Keys.ARROW_UP))
        {
            // last input 0, last input was keyboard.
            this.o_lastInput = 0;
            this.s_selectedIndex--;

            // check if there is any interactive entry ( usually there is, this is just to handle non interactive ones )
            let has_interactive = false;
            for (let i = 0; i < this.m_children.length; i++)
            {
                if (this.m_children[i].behaviour != MenuComponentBehaviour.Noninteractive)
                {
                    has_interactive = true;
                    break;
                }
            }

            if (this.s_selectedIndex < 0)
            {
                this.s_selectedIndex = this.m_children.length - 1;
            }

            // if by any chance, child index is non_interactive, skip it.
            while (has_interactive && this.m_children[this.s_selectedIndex].behaviour == MenuComponentBehaviour.Noninteractive)
            {
                this.s_selectedIndex--;
                if (this.s_selectedIndex < 0)
                {
                    this.s_selectedIndex = this.m_children.length - 1;
                }
            }
        }
    }

    private handleMouseInput (): void 
    {
        const mouse_state = this.m_inputManager.getMouseState();

        // last input == 1 ... mouse was moved in last frame, or left button down.
        if (mouse_state.deltaX != 0 || mouse_state.deltaY != 0 || this.o_lastInput == 1 || mouse_state.leftButtonDown)
        {
            this.o_lastInput = 1;

            this.__mouseRect.x = mouse_state.position[0];
            this.__mouseRect.y = mouse_state.position[1];
            this.__mouseRect.w = 1;
            this.__mouseRect.h = 1;

            // if index is not -1, then collision is found.
            let index = -1;

            // find open element
            const open_elem = this.__findOpenChild(this);

            if (open_elem != null)
            {
                for (let i = 0; i < open_elem.m_children.length; i++)
                {
                    const child = open_elem.m_children[i];

                    const intersects = this.__mouseRect.intersects(child.collisionRect);

                    if (intersects)
                    {
                        index = i;
                    }

                    // if it was pressed and not it is released.
                    if (open_elem.m_leftClick && intersects)
                    {
                        // play the sound, if not null,
                        this.m_clickSound?.play();

                        const event = new MenuEntrySelectedEvent();
                        event.entry = child.text;

                        // fire off if has event.
                        if (child.m_onSelected)
                        {
                            child.m_onSelected(event);
                        }

                        // open only if it has submenu
                        if (child.behaviour == MenuComponentBehaviour.Default && child.m_children.length > 0)
                        {
                            child.open();
                        }
                        else if (child.behaviour == MenuComponentBehaviour.GoBack && this.m_parent)
                        {
                            this.m_parent.open();
                        }
                        break;
                    }
                }
            }

            this.s_selectedIndex = index;
        }

        this.m_leftClick = false;
    }

    /**
     * Handle left click.
     */
    private leftButtonClick (): void 
    {
        this.m_leftClick = true;
        for (var child of this.m_children)
        {
            child.leftButtonClick();
        }
    }

    /**
     * @brief Try to find open child for component, and return it. If nullptr is returned, child is not found.
     *
     * @param { TextMenuComponent | null } from_component - component to find child for.
     * @return { TextMenuComponent | null } null if not found, otherwise found open component.
     */
    private __findOpenChild (for_component?: TextMenuComponent): TextMenuComponent | null
    {
        // recursievly find open element.
        if (for_component == null)
        {
            return null;
        }

        if (for_component.m_componentState == MenuComponentMenuState.Open)
        {
            return for_component;
        }

        if (for_component.m_children.length > 0)
        {
            for (const child of for_component.m_children)
            {
                const found = this.__findOpenChild(child);
                if (found != null)
                {
                    return found;
                }
            }
        }

        return null;
    }

    /**
     * Clears all the menu entries.
     */
    public clearEntries(): void 
    {
        this.m_children = [];
    }

    /**
     * @brief Create a new menu component selection entry.
     *
     * @param { string } entry - menu entry name.
     * @param { (MenuEntrySelectedEvent) => void } on_menu_entry_selected - menu entry event which is called on selection.
     * @param { MenuComponentBehaviour } behaviour - the component behaviour. Set to MenuComponentBehaviour::Default.
     * @return MenuComponent* - new menu component.
     */
    public addEntry (entry: string, on_menu_entry_selected?: (MenuEntrySelectedEvent) => void, behaviour: MenuComponentBehaviour = MenuComponentBehaviour.Default): TextMenuComponent
    {
        const menu = new TextMenuComponent(this.m_inputManager, this.m_textManager, this.m_font, entry, on_menu_entry_selected, this);
        menu.behaviour = behaviour;
        menu.textColor = this.textColor;
        menu.selectionColor = this.selectionColor;
        menu.fontScale = this.fontScale;
        this.m_children.push(menu);
        return menu;
    }

    public addNoninteractiveEntry (entry: string): TextMenuComponent
    {
        const menu = new TextMenuComponent(this.m_inputManager, this.m_textManager, this.m_font, entry, null, this);
        menu.behaviour = MenuComponentBehaviour.Noninteractive;
        menu.textColor = this.textColor;
        menu.selectionColor = this.selectionColor;
        this.m_children.push(menu);
        return menu;
    }


    /**
     * Initialize the component.
     */
    public initialize (): void 
    {
        if (this.__state == LifecycleState.Created)
        {
            // register click if parent does not exists. So if main menu.
            if (!this.m_parent)
            {
                this.m_inputManager.subscribeToOnMouseClicked(event => 
                {
                    if (event.leftClick)
                    {
                        this.leftButtonClick();
                    }
                });
            }
            for (const child of this.m_children)
            {
                child.initialize();
            }
        }
        this.__state = LifecycleState.Initialized;
    }

    /**
     * Update method.
     */
    public update (): void 
    {
        this.setupDrawAndCollisionRects();

        for (const child of this.m_children)
        {
            child.update();
        }

        this.handleMouseInput();
        this.handleKeyInput();
        this.handleGamePad();
    }

    /**
     * Draw the menu component.
     */
    public draw (): void 
    {

        // If closed, just return and don't draw a thing.
        if (this.m_componentState == MenuComponentMenuState.Closed)
            return;

        // if not closed, draw children
        for (const child of this.m_children)
        {
            child.draw();
        }

        // draw self only if open.
        if (this.m_componentState != MenuComponentMenuState.Open)
            return;

        this.m_textManager.begin();

        // can be executed only if active.

        let index = 0;
        for (const child of this.m_children)
        {
            this.o_positionValCache[0] = child.drawRect.x;
            this.o_positionValCache[1] = child.drawRect.y;

            // if selectedIndex == index, then elements is hovered over
            // non interactive cannot be selected!
            if (this.s_selectedIndex == index && child.behaviour != MenuComponentBehaviour.Noninteractive)
            {
                this.m_textManager.drawString(this.m_font, child.text, this.o_positionValCache, this.m_fontScale, this.selectionColor);
            }
            else
            {
                this.m_textManager.drawString(this.m_font, child.text, this.o_positionValCache, this.m_fontScale, this.textColor);
            }

            index++;
        }

        this.m_textManager.end();
    }

    /**
     * Open the component menu.
     */
    public open (): void 
    {
        this.m_componentState = MenuComponentMenuState.Open;
        this.m_buttonKeyPressTimer.restart();
        this.m_leftClick = false;
        for (const child of this.m_children)
        {
            child.componentState = MenuComponentMenuState.ParentOpen;
        }
        if (this.m_parent)
        {
            this.m_parent.componentState = MenuComponentMenuState.SubmenuOpen;
        }
    }

    /**
     * Close the menu.
     */
    public close (): void 
    {
        this.m_componentState = MenuComponentMenuState.Closed;
        for (const child of this.m_children)
        {
            child.close();
        }
        if (this.m_parent)
        {
            this.m_parent.componentState = MenuComponentMenuState.Closed;
        }
    }

}


export 
{
    MenuEntrySelectedEvent,
    MenuComponentBehaviour
}