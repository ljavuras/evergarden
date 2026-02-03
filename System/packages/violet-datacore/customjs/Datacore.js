class Datacore extends customJS.Violet.Package {
    vault = this.app.vault;
    core = datacore.core;
    _ready = false;

    SCRIPT_REGEX = /^(?:(?:[^\/\\]+)\/)*(?<scriptName>[^\/\\]+)\.[jt]sx?$/;

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
        // Update `config.scripts` on script update
        const updateDatacoreIndex = (file) => {
            if (!file.extension) return;
            if (ADDITIONAL_EXTENSIONS.has(file.extension.toLowerCase())) {
                this.core.trigger("update", this.core.revision);
            }
        }

        for (const vaultEvent of ['create', 'delete', 'rename']) {
            this.registerEvent(
                this.vault.on(vaultEvent, (file, oldPath) => {
                    if (!(file instanceof obsidian.TFile)) return;
                    updateDatacoreIndex(file);
                    this.updateConfig(vaultEvent, file, oldPath);
                })
            );
        }

        this.buildConfig();
        this._ready = true;
    }

    async isReady() {
        while(!this._ready) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    buildConfig() {
        const settings = this.loadSettings();
        this.config = { files: [], folders: [], scripts: {} };

        // Aggregate settings from all packages
        for (const [id, setting] of Object.entries(settings.all)) {
            this.config.files = this.config.files.concat(
                setting.files?.map(path => ({
                    packageId: id,
                    path: this.getPackage(id).path + '/' + path
                })) ?? []
            );

            this.config.folders = this.config.folders.concat(
                setting.folders?.map(path => ({
                    packageId: id,
                    path: this.getPackage(id).path + '/' + path
                })) ?? []
            );
        }

        
        // Find all components in each package
        this.config.files.forEach((fileItem) => {
            const scriptName = fileItem.path.match(this.SCRIPT_REGEX)
                ?.groups.scriptName;
            if (!scriptName) return;
            this.config.scripts[fileItem.packageId] ??= {};
            this.config.scripts[fileItem.packageId][scriptName] = fileItem.path;
        });

        this.config.folders.forEach((folderItem) => {
            customJS.Obsidian.vault.getFilesFromFolder(folderItem.path)
            .forEach((file) => {
                if (!this.SCRIPT_REGEX.test(file.path)) return;
                this.config.scripts[folderItem.packageId] ??= {};
                this.config.scripts[folderItem.packageId][file.basename] = file.path;
            });
        });
    }

    updateConfig(vaultEvent, file, oldPath) {
        const addFile = (file) => {
            if (!this.SCRIPT_REGEX.test(file.path)) return;
            const folderItem = this.config.folders
            .filter(folderItem => file.path.startsWith(folderItem.path))
            .reduce((maxFolderItem, folderItem) => {
                return maxFolderItem.path.length > folderItem.path.length
                    ? maxFolderItem
                    : folderItem;
            }, null);
            if (!folderItem) return;

            this.config.scripts[folderItem.packageId] ??= {};
            this.config.scripts[folderItem.packageId][file.basename] = file.path;
        }

        const deletePath = (path) => {
            const scriptName = path.match(this.SCRIPT_REGEX)?.groups.scriptName;
            if (!scriptName) return;

            const folderItem = this.config.folders
            .filter(folderItem => path.startsWith(folderItem.path))
            .reduce((maxFolderItem, folderItem) => {
                return maxFolderItem.path.length > folderItem.path.length
                    ? maxFolderItem
                    : folderItem;
            }, null);
            if (!folderItem) return;

            delete this.config.scripts[folderItem.packageId]?.[scriptName];
        }

        if (vaultEvent === 'create') addFile(file)
        else if (vaultEvent === 'delete') deletePath(file.path)
        else if (vaultEvent === 'rename') {
            deletePath(oldPath);
            addFile(file);
        }
    }

    async getScriptPath(packageId, scriptName) {
        await this.isReady();
        if (!(packageId in this.config.scripts)) {
            throw new Error(`Package ${packageId} doesn't exist.`);
        } else if (!this.config.scripts[packageId][scriptName]) {
            throw new Error(`Datacore component ${scriptName} doesn't exist in package ${packageId}.`)
        }
        return this.config.scripts[packageId]?.[scriptName];
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
            this.scriptCache.scripts.delete(path);

            // https://github.com/blacksmithgu/datacore/blob/966f22896ec3cbb4f2160a049c2b2d072d276880/src/api/local-api.tsx#L92-L95
            return (
                await this.scriptCache.load(path, { dc: this })
            ).orElseThrow();
        }

        /**
         * Loads a script with package support and additional features:
         * 
         * - Automatic style injection:
         *   ```
         *   path/to/package/
         *   ├── datacore
         *   |   ├── Script.tsx     # Datacore script exporting `Component`
         *   |   ├── Script.css     # Styles scoped to the script
         *   |   └── Component.css  # Styles scoped to the component
         *   └── styles.css         # Styles scoped to the package
         *   ```
         *   When `Script.tsx` is loaded, `Component.css`, `Script.css` and
         *   styles.css` are injected into `Component`.
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
            const packageName = scriptName? pathOrPackage : null;
            const scriptPath = scriptName
                ? await this.violetDatacore.getScriptPath(pathOrPackage, scriptName)
                // Convert Link to string
                // https://github.com/blacksmithgu/datacore/blob/31a8b18b0978f8b06d03d6dabcf023a7362b56f2/src/api/script-cache.ts#L127
                : (pathOrPackage.obsidianLink? pathOrPackage.obsidianLink() : pathOrPackage);
            const pkg = Object.values(this.violetDatacore.VPS.packages)
                .filter((pkg) => scriptPath.startsWith(pkg.path))
                .reduce((pkg, currentPkg) => {
                    if (currentPkg.path.length > pkg.path.length)
                        return currentPkg;
                    return pkg;
                });

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
                            pkg: pkg,
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

        async render(Component, props, containerEl) {
            const { h, render } = this.preact;

            if (!Component) {
                render(null, containerEl);  // Destroy mounted components
                return;
            }

            const scriptPath = this.scriptPath(Component);
            const pkg = Object.values(this.violetDatacore.VPS.packages)
                .filter((pkg) => scriptPath.startsWith(pkg.path))
                .reduce((pkg, currentPkg) => {
                    if (currentPkg.path.length > pkg.path.length)
                        return currentPkg;
                    return pkg;
                });
            
            const { 
                ComponentWrapper,
                AutoRefreshComponentWrapper
            } = await this.load("violet-datacore", "ComponentWrapper");
            // Use `AutoRefreshComponentWrapper` if `dc` is in dev mode
            const Wrapper = this.config?.dev
                ? AutoRefreshComponentWrapper
                : ComponentWrapper;

            render(
                h(Wrapper, {
                    pkg: pkg,
                    component: Component,
                    scriptPath: scriptPath,
                    ...props
                }),
                containerEl
            );
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