class Datacore extends customJS.Violet.Package {
    vault = this.app.vault;
    core = datacore.core;
    _ready = false;

    constructor() {
        super();

        // class VioletDatacoreLocalApi extends DatacoreLocalApi
        Object.setPrototypeOf(
            this.VioletDatacoreLocalApi.prototype,
            datacore.local()
        );
    }

    async onload() {
        // https://github.com/blacksmithgu/datacore/blob/966f22896ec3cbb4f2160a049c2b2d072d276880/src/index/types/indexable.ts#L77
        const INDEXABLE_EXTENSIONS = new Set(["md", "markdown", "canvas"]);

        // Additional extensions we wish to trigger useIndexUpdate hooks (which
        // triggers useFileMetadata, useFile...etc)
        const ADDITIONAL_EXTENSIONS = new Set(["js", "jsx", "ts", "tsx", "css"]);
        
        // Union of UNDEXABLE_EXTENSIONS and ADDITIONAL_EXTENSIONS
        // FULL_EXTENSIONS aren't needed after Datacore fixed deletion update, kept as reference
        // const FULL_EXTENSIONS = new Set();
        // INDEXABLE_EXTENSIONS.forEach((value) => FULL_EXTENSIONS.add(value));
        // ADDITIONAL_EXTENSIONS.forEach((value) => FULL_EXTENSIONS.add(value));

        // Triggers index update for additional file extensions
        this.registerEvent(
            this.vault.on("create", (file) => {
                if (!(file instanceof obsidian.TFile)) return;

                if (ADDITIONAL_EXTENSIONS.has(file.extension.toLowerCase())) {
                    this.core.trigger("update", this.core.revision);
                }
            })
        );

        this.registerEvent(
            this.vault.on("modify", (file) => {
                if (!(file instanceof obsidian.TFile)) return;

                if (ADDITIONAL_EXTENSIONS.has(file.extension.toLowerCase())) {
                    this.core.trigger("update", this.core.revision);
                }
            })
        );

        this.loadConfig();
        this._ready = true;
    }

    async isReady() {
        while(!this._ready) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    loadConfig() {
        this.loadSettings(true);
        this.config = { files: [], folders: [], components: {} };

        // Parse friend settings from other packages
        for (const [id, setting] of Object.entries(this.settings.all)) {
            this.config.files = this.config.files.concat(
                setting.files?.map(path => ({
                    violet: id, 
                path: this.getPackage(id).path + '/' + path
            })) ?? []
            );

            this.config.folders = this.config.folders.concat(
                setting.folders?.map(path => ({
                    violet: id,
                    path: this.getPackage(id).path + '/' + path
                })) ?? []
            );
        }

        // Find all components in their respective library
        this.config.files.forEach((fileItem) => {
            const componentName = fileItem.path
                .match(/([^\/\\]+)\.[jt]sx?$/)?.[1];
            this.config.components[fileItem.violet] = {
                [componentName]: fileItem.path
            };
        });

        const componentExtRegex = /^[jt]sx?$/;
        this.config.folders.forEach((folderItem) => {
            customJS.Obsidian.vault.getFilesFromFolder(folderItem.path)
            .forEach((file) => {
                if (!componentExtRegex.test(file.extension)) { return; }
                this.config.components[folderItem.violet] ??= {};
                this.config.components[folderItem.violet][file.basename] = file.path;
            });
        });
    }

    async getScriptPath(packageId, scriptName) {
        await this.isReady();
        if (!(packageId in this.config.components)) {
            throw new Error(`Package ${packageId} doesn't exist.`);
        } else if (!this.config.components[packageId][scriptName]) {
            throw new Error(`Datacore component ${scriptName} doesn't exist in package ${packageId}.`)
        }
        return this.config.components[packageId]?.[scriptName];
    }

    /**
     * Wraps DatacoreLocalApi, patch dc behavior
     * 
     * @example
     * dc = Datacore.wrap(dc);
     * // Use dc as usual
     * 
     * @param {DatacoreLocalApi} dc - dc object passed into datacore codeblocks
     * @returns {VioletDatacoreLocalApi}
     */
    wrap(dc) {
        return new this.VioletDatacoreLocalApi(dc);
    }

    // class VioletDatacoreLocalApi extends DatacoreLocalApi
    VioletDatacoreLocalApi = class {
        vault = customJS.app.vault;
        violetDatacore = customJS.Datacore;

        config = {
            // Dev mode, auto-refresh `require`d component if enabled
            dev: false
        };

        constructor(dc) {
            // dc is already wrapped, skip wrapping
            if (dc instanceof this.constructor) {
                return dc;
            }

            // Copy members from dc to maintain state
            for (const [key, value] of Object.entries(dc)) {
                if (typeof value !== "function") {
                    this[key] = value;
                }
            }
        }

        /**
         * Loads a Datacore script with package resolution.
         * 
         * Supported script sources:
         * 1. Path - Loads a script by path.
         * 2. Link - Loads a script from markdown file.
         * 3. Package - Loads a script by package name and script name.
         * 
         * Every dc of the script loaded by this function will be pre-wrapped
         * with VioletDatacoreLocalApi.
         * 
         * @param {string|Link} pathOrPackage - File path, Datacore Link to a
         * section containing the code block, or package name.
         * @param {string} scriptName - Script name when loading from package
         * @returns {any}
         */
        async load(pathOrPackage, scriptName) {
            const path = scriptName
                ? await this.violetDatacore.getScriptPath(pathOrPackage, scriptName)
                : pathOrPackage;

            // scriptCache doesn't update instantly and lags behind for unknown
            // reason. Clear cache to force reload.
            // TODO: proper fix
            this.scriptCache.scripts.clear();

            // https://github.com/blacksmithgu/datacore/blob/966f22896ec3cbb4f2160a049c2b2d072d276880/src/api/local-api.tsx#L92-L95
            return (
                await this.scriptCache.load(path, { dc: this })
            ).orElseThrow();
        }

        /**
         * Loads a script with package support and additional features:
         * 
         * - Automatic style injection - Stylesheets in the same directory
         *   whose names match the script name or exported component names
         *   are automatically included.
         * - Error boundary - Displays errored component name, script path, and
         *   logs the error to console.
         * - Dev mode auto-refresh - When `dc.config.dev` is `true`, exported
         *   component will automatically refresh when their associated script
         *   file and stylesheets have been modified.
         * 
         * Supported script sources:
         * 1. Path - Loads a script by path.
         * 2. Link - Loads a script from markdown file.
         * 3. Package - Loads a script by package name and script name.
         * 
         * Every dc of the script loaded by this function will be pre-wrapped
         * with VioletDatacoreLocalApi.
         * 
         * @param {string|Link} pathOrPackage - File path, Datacore Link to a
         * section containing the code block, or package name.
         * @param {string} scriptName - Script name when loading from package
         * @returns {any}
         */
        async require(pathOrPackage, scriptName) {
            const scriptPath = scriptName
                ? await this.violetDatacore.getScriptPath(pathOrPackage, scriptName)
                // Convert Link to string
                // https://github.com/blacksmithgu/datacore/blob/31a8b18b0978f8b06d03d6dabcf023a7362b56f2/src/api/script-cache.ts#L127
                : (pathOrPackage.obsidianLink? pathOrPackage.obsidianLink() : pathOrPackage);

            const scriptObject = await this.load(scriptPath);
            const { 
                ComponentWrapper,
                AutoRefreshComponentWrapper
            } = await this.load("violet-datacore", "ComponentWrapper");

            // Use `AutoRefreshComponentWrapper` if `dc` is in dev mode
            const Wrapper = this.config?.dev
                ? AutoRefreshComponentWrapper
                : ComponentWrapper;

            const { h } = this.preact;

            function wrapComponent(Component) {
                if (typeof Component === "function") {
                    return ({[Component.name]: ({ ...props }) =>
                        h(Wrapper, {
                            component: Component,
                            scriptPath: scriptPath,
                            ...props
                        })
                    })[Component.name];  // Return a named function
                } else {
                    let scriptObject = {}
                    for (const [key, value] of Object.entries(Component)) {
                        scriptObject[key] = wrapComponent(value);
                    }
                    return scriptObject;
                }
            }

            return wrapComponent(scriptObject);
        }

        /**
         * Gets the path of a function component, only works if the component is
         * being returned.
         * 
         * @example
         * // Within the component
         * const path = dc.scriptPath(this);
         * 
         * @param {functionComponent} functionComponent - Preact function component
         * @returns {string}
         */
        scriptPath(functionComponent) {
            for (const [key, value] of this.scriptCache.scripts) {
                if (value.object.toString() === functionComponent.toString()) {
                    return key;
                }

                for (const [name, component] of Object.entries(value.object)) {
                    if (component.toString() === functionComponent.toString()) {
                        return key;
                    }
                }
            }
        }
    }
}