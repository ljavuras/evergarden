/**
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

class Violet extends obsidian.Component {
    app = customJS.app;

    /** Package infos: package.json, settings.json, path */
    packages = {};

    /** Settings of your own, and friend settings from other packages */
    settings = { all: {} };

    /** Determines package behavior, parsed from settings */
    config = {
        customjs: { files: [], mapping: {} }
    };

    constructor() {
        super();
        this.initViolet();
    }

    require(packageId) {
        return this.packages[packageId]?.customjs;
    }

    getIdByClassName(className) {
        return this.config.customjs.mapping[className]?.id;
    }

    get packageId() {
        return "violet-core";
    }

    async initViolet() {
        await this.loadSelfSettings();
        await this.loadPackages();
        this.loadSettings();
        this.createConfig();
        await this.mountCJSInstances();
        this.load();  // Load all child components (packages)
    }

    createConfig() {
        this.config.packagesPath = this.settings.packagesPath;

        for (const [id, settings] of Object.entries(this.settings.all)) {
            const packagePath = this.packages[id].path;

            const scripts = []
            .concat(
                settings.customjs.files?.map(path =>
                    this.app.vault.getFileByPath(
                        obsidian.normalizePath(`${packagePath}/${path}`)
                    )
                )
            )
            .concat(
                settings.customjs.folders
                ?.map(path =>
                    this.app.vault.getFolderByPath(
                        obsidian.normalizePath(`${packagePath}/${path}`)
                    )
                )
                ?.map((folder) => {
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

            this.config.customjs.files = this.config.customjs.files.concat(scripts);
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
     * @returns {object}
     */
    async loadSelfSettings() {
        // Find violet-core/settings.json
        // TODO(perf): avoid filter all files in vault, read CustomJS settings,
        // and find violet-core package location
        const settingsFile = app.vault.getFiles().filter(
            (tfile) => tfile.path.endsWith("/violet-core/settings.json")
        )?.[0];

        // TODO: handle error
        if (!settingsFile) { return; }

        this.settings = Object.assign(
            this.settings,
            JSON.parse(await app.vault.cachedRead(settingsFile))
        )

        return this.settings;
    }

    /**
     * Compose settings from self and friend packages
     * @returns {object}
     */
    loadSettings() {
        for (const [id, packageInfo] of Object.entries(this.packages)) {
            if (this.packageId === id) {
                this.settings.all[id] = packageInfo.settings;
                continue;
            }
            let friend = packageInfo?.settings?.friend?.[this.packageId];
            if (friend) {
                this.settings.all[id] = friend;
            }
        }
        return this.settings;
    }

    /**
     * Spawn packages' CustomJS instance, and mount as child componenet.
     */
    async mountCJSInstances() {
        // Spawn CustomJS instances
        for (const [className, { id, file }] of Object.entries(this.config.customjs.mapping)) {

            // Skip `evalFile()` for self
            if (this.packageId === id
            && this.constructor.name === className) {
                continue;
            }

            // Create CustomJS class instance
            await customJS.app.plugins.getPlugin('customjs').evalFile(file.path);
            let instance = customJS[className];
            if (!instance) return;

            // Mount class instance to Violet.packages[id].customJS
            this.packages[id].customjs = this.packages[id].customjs ?? {};
            this.packages[id].customjs[className] = instance;

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
    async loadPackages() {
        // Parse all settings.json & package.json under package path
        const packageConfigsFiles = app.vault.getFiles()
        .filter(
            // Get all config files under package path
            (tfile) => tfile.path.startsWith(this.settings.packagesPath)
                && (tfile.path.endsWith("/settings.json")
                || tfile.path.endsWith("/package.json"))
        )

        await Promise.all(packageConfigsFiles.map(async (configFile) => {
                await this.parsePackageConfigs(configFile);
            })
        );
    }

    async parsePackageConfigs(configFile) {
        // Assumes package folder == package id
        const packageId = configFile.parent.name;
        const configContent = await app.vault.cachedRead(configFile)
            .then((configJSON) => JSON.parse(configJSON));

        if (!this.packages[packageId]) {
            this.packages[packageId] = {};
        }

        if (configFile.basename == "settings") {
            this.packages[packageId].settings = configContent;
        } else if (configFile.basename == "package") {
            this.packages[packageId].pkg = configContent;
        }

        // Workaround for CustomJS not enabling classes to get script info
        this.packages[packageId].path = configFile?.parent?.path;

        return configContent;
    }

    deconstructor() {
        this.unload();
    }

    Package = class extends obsidian.Component {
        app = customJS.app;
        Violet = customJS.Violet;

        get packageId() {
            return this.Violet.getIdByClassName(this.constructor.name);
        }

        get path() {
            return this.Violet.packages[this.packageId].path;
        }

        getPackage(id) {
            return this.Violet.packages[id];
        }

        loadPkg(force = false) {
            if (!force && this.pkg) { return this.pkg; }
            this.pkg = this.Violet.packages[this.packageId].pkg;
            return this.pkg;
        }

        loadSettings(force = false) {
            if (!force && this.settings) { return this.settings; }
            this.settings = this.Violet.packages[this.packageId].settings;
            this.settings.all = {}
            for (const [id, packageInfo] of Object.entries(this.Violet.packages)) {
                if (this.packageId === id) {
                    this.settings.all[id] = packageInfo.settings;
                    continue;
                }
                let friend = packageInfo.settings?.friend?.[this.packageId];
                if (friend) {
                    this.settings.all[id] = friend;
                }
            }
            return this.settings;
        }

        async saveSettings() {
            const { all, ...settings } = this.settings;
            await this.app.vault.adapter.write(
                `${this.path}/settings.json`,
                JSON.stringify(settings, null, 4)
            );
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
            let pkg = this.loadPkg();
            if (!pkg.id || !pkg.name) {
                throw new Error("Cannot add command, package.json is incomplete.");
            }
            if (!command.id || !command.name) {
                throw new Error("Cannot add command, bad command arguments.")
            }
            command.id = `violet:${pkg.id}:${command.id}`;
            command.name = `[Package] ${pkg.name}: ${command.name}`;
            customJS.app.commands.addCommand(command);
            this.register((() => 
                customJS.app.commands.removeCommand(command.id)
            ));
            return command;
        }

        removeCommand(commandId) {
            customJS.app.commands.removeCommand(
                `violet:${pkg.id}:${commandId}`
            );
        }
    }
}