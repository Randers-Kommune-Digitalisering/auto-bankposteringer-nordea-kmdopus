/**
 * This is the default settings file provided by Node-RED.
 *
 * It can contain any valid JavaScript code that will get run when Node-RED
 * is started.
 *
 * Lines that start with // are commented out.
 * Each entry should be separated from the entries above and below by a comma ','
 *
 * For more information about individual settings, refer to the documentation:
 *    https://nodered.org/docs/user-guide/runtime/configuration
 *
 * The settings are split into the following sections:
 *  - Flow File and User Directory Settings
 *  - Security
 *  - Server Settings
 *  - Runtime Settings
 *  - Editor Settings
 *  - Node Settings
 *
 **/

export const flowFilePretty = true;
export const uiPort = process.env.PORT || 1880;
export const diagnostics = {
    /** enable or disable diagnostics endpoint. Must be set to `false` to disable */
    enabled: true,
    /** enable or disable diagnostics display in the node-red editor. Must be set to `false` to disable */
    ui: true,
};
export const runtimeState = {
    /** enable or disable flows/state endpoint. Must be set to `false` to disable */
    enabled: false,
    /** show or hide runtime stop/start options in the node-red editor. Must be set to `false` to hide */
    ui: false,
};
export const logging = {
    /** Only console logging is currently supported */
    console: {
        /** Level of logging to be recorded. Options are:
         * fatal - only those errors which make the application unusable should be recorded
         * error - record errors which are deemed fatal for a particular request + fatal errors
         * warn - record problems which are non fatal + errors + fatal errors
         * info - record information about the general running of the application + warn + error + fatal errors
         * debug - record information which is more verbose than info + info + warn + error + fatal errors
         * trace - record very detailed logging + debug + info + warn + error + fatal errors
         * off - turn off all logging (doesn't affect metrics or audit)
         */
        level: "info",
        /** Whether or not to include metric events in the log output */
        metrics: false,
        /** Whether or not to include audit events in the log output */
        audit: false
    }
};
export const exportGlobalContextKeys = false;
export const externalModules = {
    // autoInstall: false,   /** Whether the runtime will attempt to automatically install missing modules */
    // autoInstallRetry: 30, /** Interval, in seconds, between reinstall attempts */
    // palette: {              /** Configuration for the Palette Manager */
    //     allowInstall: true, /** Enable the Palette Manager in the editor */
    //     allowUpdate: true,  /** Allow modules to be updated in the Palette Manager */
    //     allowUpload: true,  /** Allow module tgz files to be uploaded and installed */
    //     allowList: ['*'],
    //     denyList: [],
    //     allowUpdateList: ['*'],
    //     denyUpdateList: []
    // },
    // modules: {              /** Configuration for node-specified modules */
    //     allowInstall: true,
    //     allowList: [],
    //     denyList: []
    // }
};
export const storageModule = require('node-red-contrib-js-storage');
export const flowFileReadOnly = true;
export const editorTheme = {
    header: { title: process.env.pwd },
    /** The following property can be used to set a custom theme for the editor.
     * See https://github.com/node-red-contrib-themes/theme-collection for
     * a collection of themes to chose from.
     */
    //theme: "",
    /** To disable the 'Welcome to Node-RED' tour that is displayed the first
     * time you access the editor for each release of Node-RED, set this to false
     */
    //tours: false,
    palette: {
        /** The following property can be used to order the categories in the editor
         * palette. If a node's category is not in the list, the category will get
         * added to the end of the palette.
         * If not set, the following default order is used:
         */
        //categories: ['subflows', 'common', 'function', 'network', 'sequence', 'parser', 'storage'],
    },

    projects: {
        /** To enable the Projects feature, set this value to true */
        enabled: false,
        workflow: {
            /** Set the default projects workflow mode.
             *  - manual - you must manually commit changes
             *  - auto - changes are automatically committed
             * This can be overridden per-user from the 'Git config'
             * section of 'User Settings' within the editor
             */
            mode: "manual"
        }
    },

    codeEditor: {
        /** Select the text editor component used by the editor.
         * As of Node-RED V3, this defaults to "monaco", but can be set to "ace" if desired
         */
        lib: "monaco",
        options: {
            /** The follow options only apply if the editor is set to "monaco"
             *
             * theme - must match the file name of a theme in
             * packages/node_modules/@node-red/editor-client/src/vendor/monaco/dist/theme
             * e.g. "tomorrow-night", "upstream-sunburst", "github", "my-theme"
             */
            // theme: "vs",
            /** other overrides can be set e.g. fontSize, fontFamily, fontLigatures etc.
             * for the full list, see https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.IStandaloneEditorConstructionOptions.html
             */
            //fontSize: 14,
            //fontFamily: "Cascadia Code, Fira Code, Consolas, 'Courier New', monospace",
            //fontLigatures: true,
        }
    }
};
export const functionExternalModules = true;
export const functionGlobalContext = {
    // os:require('os'),
};
export const debugMaxLength = 1000;
export const mqttReconnectTime = 15000;
export const serialReconnectTime = 15000;