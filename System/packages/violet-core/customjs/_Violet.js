/**
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

class Violet extends obsidian.Component {
    app = customJS.app;
    VPS = this;

    /** Package infos: manifest.json, settings.json, path */
    packages = {};

    /**
     * @type {Violet.Settings}
     */
    settings;

    /** Determines package behavior, parsed from settings */
    config = {
        customjs: { scripts: [], mapping: {} }
    };

    /** Functions that execute when a package is ready */
    _onReady = {};

    /**
     * Gets CustomJS class instances from a package.
     * @param {string} packageId - Target package.
     * @returns {Record<string, object>} Class instances from targeted package.
     */
    require(packageId) {
        return this.packages[packageId]?.customjs;
    }

    /**
     * Gets package by provided CustomJS class instance.
     * @param {object} cjsInstance - Target CustomJS class instance.
     * @returns {string} Package id of the instance belongs to.
     */
    getPackageByInstance(cjsInstance) {
        for (const [id, { customjs }] of Object.entries(this.packages)) {
            if (!customjs) continue;
            for (const instance of Object.values(customjs)) {
                if (cjsInstance === instance) return id;
            }
        }
        return null;
    }

    getPackageNameById(id) {
        return this.packages[id]?.manifest.name;
    }

    constructor() {
        super();
        window.VPS = this;
        this.initViolet();
    }

    onload() {
        const updateSettingsFromFile = async (file, erase=false) => {
            const packageId = file.parent.path.slice(
                this.config.packagesPath.length
            );
            this.packages[packageId]?.settings.set(
                erase
                    ? {}
                    : JSON.parse(await this.app.vault.cachedRead(file)),
                true
            );
        }
        this.registerEvent(this.app.vault.on('create', async (file) => {
            if (file instanceof obsidian.TFile)
                if (file.name === "settings.json")
                    await updateSettingsFromFile(file);
        }));
        this.registerEvent(this.app.vault.on('modify', async (file) => {
            if (file instanceof obsidian.TFile)
                if (file.name === "settings.json")
                    await updateSettingsFromFile(file);
        }));
        this.registerEvent(this.app.vault.on('delete', async (file) => {
            if (file instanceof obsidian.TFile)
                if (file.name === "settings.json")
                    await updateSettingsFromFile(file, true);
        }));
    }

    get packageId() {
        return "violet-core";
    }

    async initViolet() {
        await this.loadPackagesPath();
        await this.loadAllPackages();
        this.settings = this.loadSettings();
        this.buildConfig();
        await this.mountCJSInstances();
        this.load();  // Load all child components (packages)
    }

    buildConfig() {
        this.config = {
            packagesPath: this.settings.get()?.packagesPath,
            customjs: { scripts: [], mapping: {} }
        };

        // Find scripts from every pacakges' files & folders friend setting
        for (const [id, settings] of Object.entries(this.settings.all)) {
            const packagePath = this.packages[id].path;

            const scripts = []
            .concat(
                // Individual files from `friend['violet-core'].customjs.files`
                settings.customjs?.files?.map(path =>
                    this.app.vault.getFileByPath(
                        obsidian.normalizePath(`${packagePath}/${path}`)
                    )
                )
            )
            .concat(
                // Folders from `friend['violet-core'].customjs.folders`
                settings.customjs?.folders
                ?.map(path =>
                    this.app.vault.getFolderByPath(
                        obsidian.normalizePath(`${packagePath}/${path}`)
                    )
                )
                ?.map((folder) => {
                    // Get all *.js files within the folder
                    let scripts = [];
                    obsidian.Vault.recurseChildren(folder, (file) => {
                        if (file instanceof obsidian.TFile
                            && file.name.endsWith(".js")
                        ) {
                            scripts.push(file);
                        }
                    });
                    return scripts;
                })
                ?.flat()
            )
            .filter(file => file);  // remove null

            this.config.customjs.scripts.push(...scripts);
            scripts.map((file) => {
                this.config.customjs.mapping[getClassNameByScript(file)] = {
                    id: id,
                    file: file
                };
            });
        }

        /**
         * Assumes every CustomJS script's name is identical to the class written
         * in them. Allows non-alphabetical characters to prepend script name.
         * - _Violet.js => class Violet
         * - script/001Template.js => class Template
         * 
         * @todo actually parse file content to get accurate class name
         */
        function getClassNameByScript(file) {
            return file.basename
                .match(/^[^a-zA-Z]*(?<className>.*)$/)?.groups?.className;
        }
    }

    /**
     * Load settings of only this package
     * @returns {Promise}
     */
    async loadPackagesPath() {
        // Find violet-core/settings.json
        // TODO(perf): avoid filter all files in vault, read CustomJS settings,
        // and find violet-core package location
        const settingsFile = app.vault.getFiles().filter(
            (tfile) => tfile.path.endsWith(`/${this.packageId}/settings.json`)
        )?.[0];
        if (!settingsFile) {
            throw new Error(
                `VPS: settings.json not found for package ${this.packageId}`
            );
        }

        this.config.packagesPath = JSON.parse(
            await app.vault.cachedRead(settingsFile)
        )
        .packagesPath
        .replace(/\/$/, "");  // Remove following "/" if exist

        if (!this.config.packagesPath) {
            throw new Error(
                `VPS: settings.json didn't define packagesPath (path of packages)`
            );
        }
    }

    /**
     * @returns {this.Settings}
     */
    loadSettings() {
        return this.packages[this.packageId].settings;
    }

    /**
     * Spawn packages' CustomJS instance, and mount as child componenet.
     */
    async mountCJSInstances() {
        // Spawn CustomJS instances
        for (const [className, { id, file }] of Object.entries(this.config.customjs.mapping)) {
            let instance;

            // Skip `evalFile()` for self
            if (this.packageId === id
                && this.constructor.name === className
            ) {
                instance = this;
            } else {
                // CustomJS creates class instance
                await this.app.plugins.getPlugin('customjs').evalFile(file.path);

                // Get instance from CustomJS
                instance = customJS[className];
                if (!instance) return;
            }

            // Store class instance to each package profile: Violet.packages[id].customJS
            this.packages[id].customjs ??= {};
            this.packages[id].customjs[className] = instance;
            instance.manifest = this.packages[id].manifest;

            // Mount class instancs as Violet component child
            this.addChild(instance);
        }
    }

    /**
     * Fetech all package configs.
     * 
     * CustomJS classes doesn't know their own path (efficiently), thus their
     * info are supplied by this package.
     */
    async loadAllPackages() {
        // Parse all settings.json & manifest.json under package path
        const packageConfigFiles = app.vault.getFiles()
        .filter(
            // Get all config files under package path
            (tfile) => tfile.path.startsWith(this.config.packagesPath + "/")
                && (tfile.path.endsWith("/settings.json")
                || tfile.path.endsWith("/manifest.json"))
        )

        await Promise.all(packageConfigFiles.map(async (configFile) => {
                await this.parsePackageConfigs(configFile);
            })
        );
    
        for (const packageId of Object.keys(this.packages)) {
            if (!this.packages[packageId].settings) {
                this.packages[packageId].settings = new this.Settings(packageId);
            }
        }
    }

    async parsePackageConfigs(configFile) {
        // Assumes package folder == package id
        const packageId = configFile.parent.path
            .slice(this.config.packagesPath.length + 1);
        const configContent = JSON.parse(
            await app.vault.cachedRead(configFile)
        );
        this.packages[packageId] ??= {};
        // Workaround for CustomJS not enabling classes to get script info
        this.packages[packageId].path = configFile?.parent?.path;

        if (configFile.basename === "settings") {
            this.packages[packageId].settings = (
                new this.Settings(packageId)
            ).set(configContent);
        } else if (configFile.basename === "manifest") {
            this.packages[packageId].manifest = configContent;
        }
    }

    registerOnReady(packageId, className, callback) {
        this._onReady[`${packageId}:${className}`] ??= [];
        this._onReady[`${packageId}:${className}`].push(callback);
        if (this.packages[packageId]?.customjs?.[className]?._loaded) {
            callback(this.packages[packageId].customjs[className]);
        }
    }

    unregisterOnReady(packageId, className, callback) {
        const callbacks = this._onReady[`${packageId}:${className}`];
        const index = callbacks?.indexOf(callback);
        if (index > -1) { callbacks.splice(index, 1); }
    }

    deconstructor() {
        this.unload();
        delete window.VPS;
    }

    /**
     * Controlled settings interface that ensures reliable propagation of
     * inter-package (`friend`) settings within VPS.
     * 
     * Fires update event when updated by either itself or a friendly package.
     */
    Settings = class Settings extends obsidian.Events {
        #settings = {};
        #packageId;

        constructor(packageId) {
            super();
            this.#packageId = packageId;
        }

        /**
         * Returns an object that represents the setting this package owns, not
         * including settings other packages contributes to this package.
         * Modification on this object **does not** update a package's settings.
         * @returns {any} Current setting.
         */
        get() {
            return structuredClone(this.#settings);
        }

        /**
         * Returns the difference between updated and original object. Defaults
         * to compare with current settings.
         * {@link https://github.com/mattphillips/deep-object-diff/blob/a24d61fea6d6d644fc3e32a853f685953d6d5b41/src/diff.js}
         * @param {Object} newObj - Updated object
         * @param {Object} oldObj - Original object
         * @returns {Object}
         */
        diff(newObj, oldObj = this.#settings) {
            const isObject = (o) =>
                o != null && typeof o === "object";
            const isEmptyObject = (o) =>
                isObject(o) && Object.keys(o).length === 0;

            if (newObj === oldObj) return {};
            if (!isObject(oldObj) || !isObject(newObj)) return newObj;
            if ((oldObj instanceof Date) || (newObj instanceof Date)) {
                if (oldObj.valueOf() == newObj.valueOf()) return {};
                return newObj;
            }

            // Mark deleted keys as undefined
            const deletedValues = Object.keys(oldObj).reduce((acc, key) => {
                if (!Object.hasOwn(newObj, key))
                    acc[key] = undefined;
                return acc;
            }, Object.create(null));

            return Object.keys(newObj).reduce((acc, key) => {
                if (!Object.hasOwn(oldObj, key)) {
                    acc[key] = newObj[key];
                    return acc;
                }

                const difference = this.diff(newObj[key], oldObj[key]);

                if (isEmptyObject(difference) && !(difference instanceof Date)
                    && (isEmptyObject(oldObj[key]) || !isEmptyObject(newObj[key]))
                )
                    return acc;  // No diff

                acc[key] = difference;
                return acc;
            }, deletedValues);
        } 

        _triggerUpdate(update) {
            // Trigger settings update events for affected packages
            const selfUpdate = update;
            delete selfUpdate.friend;
            if (Object.keys(update).some(key => key !== "friend")) {
                this.trigger("update", this.#packageId, selfUpdate);
            }
            for (const packageId of Object.keys(update.friend ?? {})) {
                this.VPS.packages[packageId].settings
                    .trigger("update", this.#packageId, update.friend[packageId]);
            }
        }

        /**
         * The function to call when settings is updated.
         * @callback settingsUpdateCallback
         * @param {string} packageId - The package that triggered the update
         * @param {object} update - Updated part of the setting.
         */

        /**
         * Register a callback for settings update.
         * @function on
         * @overload
         * @param {"update"} name - Event name.
         * @param {settingsUpdateCallback} callback - Called on settings update.
         * @return {EventRef}
         */

        /**
         * Set its settings without triggering update events on itself and
         * friend settings.
         * @param {Object} settings - The new setting.
         * @param {boolean} trigger - Fire events to affected packages if true.
         * @returns {Violet.Settings} Returns itself, allows chaining
         */
        set(settings, trigger = false) {
            if (trigger)
                var update = this.diff(settings);
            this.#settings = structuredClone(settings) ?? {};
            if (trigger) this._triggerUpdate(update);
            return this;
        }

        /**
         * Assigns one or more partial setting objects to this settings, similar
         * to `Object.assign()`.
         * 
         * Differences from `Object.assign()`:
         * - Triggers a update event on itself after assignment.
         * - Keys with `undefined` value are removed.
         * - Updates to friend settings triggers update events on corresponding
         *   settings objects.
         * @param  {...Object} patches - Part of the settings that are to be
         * updated.
         * @returns {Violet.Settings} Returns itself to allow chaining.
         */
        assign(...patches) {
            const update = Object.assign(...patches);
            Object.assign(this.#settings, update);
            
            // Delete keys with value === undefined
            const pruneUndefined = (setting) => {
                const prunedSetting = {};
                Object.keys(setting).forEach((key) => {
                    if (setting[key] === Object(setting[key]))
                        prunedSetting[key] = pruneUndefined(setting[key]);
                    else if (setting[key] !== undefined)
                        prunedSetting[key] = setting[key];
                })
                return prunedSetting;
            }
            this.#settings = pruneUndefined(this.#settings);
            this._triggerUpdate(update);
            return this;
        }

        /**
         * Similar to {@link Violet.Settings#assign}, but doesn't accept
         * `undefined` value.
         * Use this method if you do not wish to accidentally delete keys from
         * settings.
         * @param  {...any} patches - Part of the settings that are to be
         * updated
         * @returns {Violet.Settings} Returns itself to allow chaining.
         */
        patch(...patches) {
            const update = Object.assign(...patches)
            const validatePatch = (patch) => {
                Object.keys(patch).forEach((key) => {
                    if (patch[key] === undefined) {
                        throw new Error(
                            `Settings.patch(): attempting to update settings with undefined value on key ${key}. `
                            + `Use Settings.assign() to delete keys by assigning undefined, or provide a valid value.`
                        );
                    }
                    if (patch[key] === Object(patch[key]))
                        validatePatch(patch[key]);
                });
            }
            patches.forEach(patch => validatePatch(patch));
            this.assign(this.#settings, update);
            this._triggerUpdate(update);
            return this;
        }

        /**
         * All settings every package contributes to this package, includes
         * itself.
         * @type {Object}
         */
        get all() {
            const all = {};
            for (const [friendId, pkg] of Object.entries(this.VPS.packages)) {
                const friendSetting = pkg.settings?.friend(this.#packageId);
                if (friendSetting) all[friendId] = friendSetting;
            }
            return all;
        }

        /**
         * Gets the setting this package contributes to package `friendId`.
         * @param {string} friendId - The target package this package
         * contributes settings to.
         * @returns {Object | undefined}
         */
        friend(friendId) {
            if (friendId === this.#packageId) return this.get();
            return structuredClone(this.#settings.friend?.[friendId]);
        }
    }

    Package = class Package extends obsidian.Component {
        app = customJS.app;
        VPS = customJS.Violet;

        get packageId() {
            return this.manifest.id;
        }

        get path() {
            return this.VPS.packages[this.packageId].path;
        }

        /** Override load to call queued onReady callbacks */
        async load() {
            await super.load();
            const asyncFns = [];
            this.VPS._onReady[`${this.packageId}:${this.constructor.name}`]
            ?.forEach((callback) => {
                const promise = callback(this);
                if (promise) { asyncFns.push(promise); }
            });
            if (asyncFns.length > 0) {
                await Promise.all(asyncFns);
            }
        }

        getPackage(id) {
            return this.VPS.packages[id];
        }

        loadSettings() {
            return this.VPS.packages[this.packageId].settings;
        }

        async saveSettings() {
            const { all, ...settings } = this.settings;
            await this.app.vault.adapter.write(
                `${this.path}/settings.json`,
                JSON.stringify(settings, null, 4)
            );
        }

        onPackageReady(packageId, className, callback) {
            this.VPS.registerOnReady(packageId, className, callback);
            this.register(() => {
                this.VPS.unregisterOnReady(packageId, className, callback);
            });
        }

        /**
         * Add command, see {@link https://docs.obsidian.md/Plugins/User+interface/Commands}
         * 
         * Command id and name will be prefixed with package id and name.
         * Commands will be unregistered automatically upon unload.
         * @param {string} command.id
         * @param {string} command.name
         * @param {function} command.callback
         */
        addCommand(command) {
            let { manifest } = this;
            if (!manifest.id || !manifest.name) {
                throw new Error("Cannot add command, manifest.json is incomplete.");
            }
            if (!command.id || !command.name) {
                throw new Error("Cannot add command, bad command arguments.")
            }
            command.id = `violet:${manifest.id}:${command.id}`;
            command.name = `[Package] ${manifest.name}: ${command.name}`;
            customJS.app.commands.addCommand(command);
            this.register(() => 
                customJS.app.commands.removeCommand(command.id)
            );
            return command;
        }

        removeCommand(commandId) {
            customJS.app.commands.removeCommand(
                `violet:${this.packageId}:${commandId}`
            );
        }

        /**
         * Register an embed to be rendered.
         * @param {object} embedSpec - Positions and renders the embed
         * @param {string} embedSpec.id
         * @param {number} embedSpec.order
         * @param {(view: MarkdownView) => boolean} embedSpec.shouldEmbed
         * @param {(containerEl: HTMLElement, view: MarkdownView) => null} embedSpec.renderEmbed
         * @param {(renderer: MarkdownPreviewRenderer) => {anchorEl: HTMLElement, order: number}} [embedSpec.locatePreviewAnchor]
         * @param {(tree: import('@lezer/common').Tree, editorState: import('@codemirror/state').EditorState) => {pos: number, side: number}} [embedSpec.locateSourcePosition]
         */
        registerEmbed(embedSpec) {
            embedSpec.id = `${this.packageId}:${embedSpec.id}`;
            this.onPackageReady(
                "evergarden-auto-embed",
                "AutoEmbed",
                (AutoEmbed) => {
                    AutoEmbed.registerEmbed(embedSpec);
                }
            );
            this.register(() => customJS.AutoEmbed?.unregisterEmbed(embedSpec.id));
        }

        unregisterEmbed(embedId) {
            customJS.AutoEmbed?.unregisterEmbed(`${this.packageId}:${embedId}`);
        }

        /**
         * Handles code block post-processing, see {@link https://docs.obsidian.md/Reference/TypeScript+API/Plugin/registerMarkdownCodeBlockProcessor}
         * For `MarkdownPostProcessorContext`, see {@link https://docs.obsidian.md/Reference/TypeScript+API/MarkdownPostProcessorContext}
         * @callback Violet~codeBlockProcessor
         * @param {string} source
         * @param {HTMLElement} element
         * @param {MarkdownPostProcessorContext} context
         */

        /**
         * Post-process code blocks, see {@link https://docs.obsidian.md/Plugins/Editor/Markdown+post+processing#Post-process+Markdown+code+blocks}
         * Will automatically unregister upon unload. If you want to unregister
         * beforehand, save the returned `postProcessor` and pass it into
         * `unregisterMarkdownCodeBlockProcessor`.
         * @param {string} langauge
         * @param {Violet~codeBlockProcessor} handler
         * @param {number} [sortOrder] 
         * @returns {MarkdownPostProcessor} - See {@link https://docs.obsidian.md/Reference/TypeScript+API/MarkdownPostProcessor}
         */
        registerMarkdownCodeBlockProcessor(langauge, handler, sortOrder) {
            const MarkdownPreviewRenderer = obsidian.MarkdownPreviewRenderer;
            const postProcessor = MarkdownPreviewRenderer.createCodeBlockPostProcessor(langauge, handler);
            MarkdownPreviewRenderer.registerPostProcessor(postProcessor, sortOrder);
            MarkdownPreviewRenderer.registerCodeBlockPostProcessor(langauge, handler);
            this.app.workspace.trigger("post-processor-change");
            this.register(() => {
                this.unregisterMarkdownCodeBlockProcessor(langauge, postProcessor);
            });
            return postProcessor;
        }

        unregisterMarkdownCodeBlockProcessor(langauge, postProcessor) {
            const MarkdownPreviewRenderer = obsidian.MarkdownPreviewRenderer;
            MarkdownPreviewRenderer.unregisterPostProcessor(postProcessor);
            MarkdownPreviewRenderer.unregisterCodeBlockPostProcessor(langauge);
            this.app.workspace.trigger("post-processor-change");
        }

        /**
         * Post-processes rendered markdown.
         * For `MarkdownPostProcessorContext`, see {@link https://docs.obsidian.md/Reference/TypeScript+API/MarkdownPostProcessorContext}
         * @callback Violet~markdownProcessor
         * @param {HTMLElement} element
         * @param {MarkdownPostProcessorContext} context
         */

        /**
         * Post-process rendered markdown, see {@link https://docs.obsidian.md/Plugins/Editor/Markdown+post+processing}
         * Will automatically unregister upon unload.
         * @param {Violet~markdownProcessor} postProcessor 
         * @param {number} sortOrder 
         * @returns {MarkdownPostProcessor}
         */
        registerMarkdownPostProcessor(postProcessor, sortOrder) {
            const MarkdownPreviewRenderer = obsidian.MarkdownPreviewRenderer;
            MarkdownPreviewRenderer.registerPostProcessor(postProcessor, sortOrder);
            this.app.workspace.trigger("post-processor-change");
            this.register(() => {
                this.unregisterMarkdownPostProcessor(postProcessor)
            });
            return postProcessor;
        }
        
        unregisterMarkdownPostProcessor(postProcessor) {
            const MarkdownPreviewRenderer = obsidian.MarkdownPreviewRenderer;
            MarkdownPreviewRenderer.unregisterPostProcessor(postProcessor);
            this.app.workspace.trigger("post-processor-change");
        }

        /**
         * Register a CodeMirror 6 extension, see:
         * - {@link https://docs.obsidian.md/Plugins/Editor/Editor+extensions}
         * - {@link https://docs.obsidian.md/Reference/TypeScript+API/Plugin/registerEditorExtension}
         * @param {extension} extension - CodeMirror 6 extension, see {@link https://codemirror.net/docs/ref/#state.Extension}
         */
        registerEditorExtension(extension) {
            this.app.workspace.registerEditorExtension(extension);
            this.register(() => {
                this.app.workspace.unregisterEditorExtension(extension);
            })
        }
    }
}