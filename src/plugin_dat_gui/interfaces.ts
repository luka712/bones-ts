import * as dat from 'dat.gui';

/**
 * Extended GUI controller.
 */
interface GUIController extends dat.GUIController
{
    addImage(target: Object, prop_name: string): GUIController;
}

/**
 * Extended GUI.
 */
interface GUI extends dat.GUI 
{
    addFolder(prop_name: string): GUI;
    addImage(target: Object, prop_name: string): GUIController
}


export 
{
    GUI,
    dat,
}