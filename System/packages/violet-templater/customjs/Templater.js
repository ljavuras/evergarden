/**
 * A facade of Templater API
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

class Templater extends customJS.Violet.Package {
    plugin = app.plugins.getPlugin('templater-obsidian');
    // TODO: handle plugin not available

    // Templater enum RunMode definition, extracted from:
    // https://github.com/SilentVoid13/Templater/blob/2abce98863bfad10c3f9ee6440f808f9ff9dbd10/src/core/Templater.ts#L25
    RunMode = Object.freeze({
        CreateNewFromTemplate: 0,
        AppendActiveFile     : 1,
        OverwriteFile        : 2,
        OverwriteActiveFile  : 3,
        DynamicProcessor     : 4,
        StartupTemplate      : 5,
    });

    // https://github.com/SilentVoid13/Templater/blob/e2f8bf5f2bb3f01c02b468284cfc283789873fff/src/core/functions/FunctionsGenerator.ts#L8
    FunctionsMode = Object.freeze({
        INTERNAL     : 0,
        USER_INTERNAL: 1,
    });

    config = {
        files: [],
        folders: [],
        // Templater plugin settings
        plugin: {
            folder: this.plugin.settings.templates_folder,
            // Backup up original settings
            settings: {
                trigger_on_file_creation: this.plugin.settings.trigger_on_file_creation,
            }
        }
    };

    onload() {
        this.loadSettings();
        this._buildConfig();
        this._registerOnCreate();
        this.commands.forEach(cmd => this.addCommand(cmd));
        this.getTemplates(true);
        this._watchTemplateUpdate();
        this._watchSettingsUpdate();
    }

    commands = [
        {
            id: "create-new-note-from-template",
            name: "Create new note from template",
            callback: () => {
                new this.TemplaterFuzzySuggester(
                    this,
                    this.RunMode.CreateNewFromTemplate
                ).open();
            }
        },
        {
            id: "insert-template",
            name: "Insert template to active note",
            callback: () => {
                new this.TemplaterFuzzySuggester(
                    this,
                    this.RunMode.AppendActiveFile
                ).open();
            }
        },
    ]

    _getPackageSubFolder(packageId, path) {
        // Empty string, package root
        if (path.length === 0)
            return this.getPackage(packageId).path

        return `${this.getPackage(packageId).path}/${path}`;
    }

    _buildConfig() {
        const settings = this.settings;

        Object.assign(
            this.config,
            {
                files: [],
                folders: [],
                overrideTemplaterOnCreate: settings.overrideTemplaterOnCreate,
            }
        );

        // Plugin Templater settings
        if (this.config.plugin.folder) {
            this.config.folders.push({
                source: {
                    type: "plugin",
                    id: "templater-obsidian",
                },
                path: this.config.plugin.folder
            })
        }

        for (const [id, setting] of Object.entries(this.settings.all)) {
            // Package template files
            this.config.files = this.config.files.concat(
                setting.files?.map(path => ({
                    source: { type: "package", id }, 
                    path: this._getPackageSubFolder(id, path),
                })) ?? []
            );

            // Package template folders
            this.config.folders = this.config.folders.concat(
                setting.folders?.map(path => ({
                    source: { type: "package", id },
                    path: this._getPackageSubFolder(id, path),
                })) ?? []
            );
        }
    }

    _refreshConfig(packageId, update) {
        const clearConfigFiles = (packageId) => {
            this.config.files = this.config.files.filter(
                t => t.source.id !== packageId
            );
        }

        const clearConfigFolders = (packageId) => {
            this.config.folders = this.config.folders.filter(
                t => t.source.id !== packageId
            );
        }

        if (update === undefined) {
            clearConfigFiles(packageId);
            clearConfigFolders(packageId);
            return;
        }

        if (packageId === this.packageId
            && Object.hasOwn(update, 'overrideTemplaterOnCreate')
        ) {
            this.config.overrideTemplaterOnCreate = update.overrideTemplaterOnCreate;
        }

        // Cache changed plugin settings
        const friendSettings = this.settings.all[packageId];

        if (Object.hasOwn(update, 'files')) {
            clearConfigFiles(packageId);
            for (const path of friendSettings.files) {
                this.config.files.push({
                    source: { type: "package", id: packageId },
                    path: this._getPackageSubFolder(packageId, path),
                });
            }
        }

        if (Object.hasOwn(update, 'folders')) {
            clearConfigFolders(packageId);
            for (const path of friendSettings.folders) {
                this.config.folders.push({
                    source: { type: "package", id: packageId },
                    path: this._getPackageSubFolder(packageId, path),
                });
            }
        }
    }

    _registerOnCreate() {
        if (!this.config.overrideTemplaterOnCreate) return;

        // Disable Templater's onCreate handler
        // https://github.com/SilentVoid13/Templater/blob/80a4b3d6d2c0321ab9243a82974d624e121a3fb5/src/settings/Settings.ts#L217-L220
        if (this.plugin.settings.trigger_on_file_creation) {
            this.plugin.settings.trigger_on_file_creation = false;
            this.plugin.event_handler.update_trigger_file_on_creation();
        }

        // Restore Templater's onCreate handler on unload
        this.register(() => {
            if (this.config.plugin.settings.trigger_on_file_creation
                !== this.plugin.settings.trigger_on_file_creation
            ) {
                this.plugin.settings.trigger_on_file_creation
                    = this.config.plugin.settings.trigger_on_file_creation;
                
                this.plugin.event_handler.update_trigger_file_on_creation();
            }
        });

        // Register our own onCreate handler
        // https://github.com/SilentVoid13/Templater/blob/80a4b3d6d2c0321ab9243a82974d624e121a3fb5/src/core/Templater.ts#L519
        this.registerEvent(this.app.vault.on('create', async (file) => {
            if (!(file instanceof obsidian.TFile)
                || file.extension !== "md"
            ) {
                return;
            }

            // Check if file is a template
            for (const { path } of this.config.files)
                if (file.path === path) return;
            for (const { path } of this.config.folders)
                if (file.path.startsWith(path)) return;

            // Wait for core plugin Note composer finish insert content
            await new Promise((resolve) => setTimeout(resolve, 300));

            // Skip if a template is waiting to be inserted
            if (this.plugin.templater.files_with_pending_templates.has(
                file.path
            )) {
                return;
            }

            /**
             * If file isn't empty, skip insert template.
             * This behavior is different from Templater. When the created file
             * isn't empty, e.g., file moving within the vault, Templater won't
             * insert a new template, but will execute existing Templater
             * scripts in the file. This creates unexpected script execution in
             * my opinion.
             * https://github.com/SilentVoid13/Templater/blob/80a4b3d6d2c0321ab9243a82974d624e121a3fb5/src/core/Templater.ts#L590-L600
             */
            if (file.stat.size > 0) return;

            const template = this.getFile(await this.resolveTemplate(file));
            await this.plugin.templater.write_template_to_file(template, file);
        }));
    }

    _watchTemplateUpdate() {
        const addTemplate = (file) => {
            // Find matching template file
            let t = this.config.files.find(f => f.path === file.path)

            // Find matching folder with deepest path
            if (!t)
                t = this.config.folders.filter(f => file.path.startsWith(f.path))
                .reduce((max, t) => {
                    return (max.path?.length ?? 0) > t.path.length? max : t;
                }, false);
            
            if (!t) return;

            const template = Object.assign({}, t, { file: file });
            delete template.path;
            this.templates.push(template);
        }

        const removeTemplate = (path) => {
            this.templates = this.templates.filter(t => t.file.path !== path);
        }

        this.registerEvent(this.app.vault.on('create', addTemplate));
        this.registerEvent(this.app.vault.on(
            'delete',
            (file) => removeTemplate(file.path)
        ));
        this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
            addTemplate(file);
            removeTemplate(oldPath);
        }));
    }

    _watchSettingsUpdate() {
        this.registerEvent(
            this.settings.on('update', (packageId, update) => {
                this._refreshConfig(packageId, update);
                this._refreshTemplates(packageId);
            })
        );
    }

    /**
     * Get all templates, including deprecated, system and update templates
     * @returns {Object[]}
     */
    getTemplates(refresh = false) {
        // Cache hit
        if (!refresh && this.templates) { return this.templates; }

        let templateItems = this.config.files.map(t => ({
                source: t.source,
                file: app.vault.getFileByPath(t.path),
            })
        );
        let inFolderTemplates = this.config.folders
        .map((t) => 
            customJS.Obsidian.vault
            .getFilesFromFolder(t.path)
            .map(file => ({
                source: t.source,
                file,
            }))
        )
        .flat();
        templateItems = templateItems.concat(inFolderTemplates ?? []);
        templateItems.sort(
            (a, b) => a.file.basename.localeCompare(b.file.basename)
        );
        this.templates = templateItems;
        return templateItems;
    }

    _refreshTemplates(packageId) {
        this.templates = this.templates.filter(t => t.source.id !== packageId);
        this.templates = this.templates
        .concat(
            this.config.files
            .filter(t => t.source.id === packageId)
            .map(t => ({
                source: t.source,
                file: app.vault.getFileByPath(t.path)
            })) ?? []
        )
        .concat(
            this.config.folders
            .filter(t => t.source.id === packageId)
            .map(t => customJS.Obsidian.vault
                .getFilesFromFolder(t.path)
                .map(file => ({ source: t.source, file }))
            )
            .flat() ?? []
        );
        this.templates.sort(
            (a, b) => a.file.basename.localeCompare(b.file.basename)
        );
    }

    /**
     * Get templates meant to be used by users
     * @returns {Object[]}
     */
    getUserTemplates() {
        return this.getTemplates().filter((item) => {
            let name = item.file.basename;
            return !(name.startsWith("bug.")  // Bug demo
                || name.startsWith("depr.")  // Deprecated
                || name.startsWith("system.")  // System templates
                || name.match(/\.update\.\d+$/)  // Updater templates
                || name.match(/\.parse\.\d+$/)  // Parser templates
                || name.match(/\.compose\.\d+$/)  // Composer templates
            );
        });
    }

    /**
     * Gets an Obsidian file object of a template
     * @param {string} template - Basename or wikilink to a template
     * @returns {TFile}
     */
    getFile(template) {
        let templateName = template.match(/^\[\[(.*)\]\]$/)?.[1] ?? template;
        return this.getTemplates().find(
            (item => item.file.basename.localeCompare(templateName) === 0)
        )?.file;
    }

    getInfo(templateName) {
        return customJS.Script.get(
            this.getFile(templateName)
        );
    }

    exists(templateName) {
        return this.getTemplates().some(
            (item) => item.file.basename.localeCompare(templateName) === 0
        );
    }

    /**
     * Finds a template for the given file.
     * @param {TFile} file - Target file to insert template.
     * @returns {Promise<string>} - Template name.
     * @todo Return TFile allows same template name from multiple packages.
     */
    async resolveTemplate(file) {

        let state = {
            file: file,
            prevFile: customJS.Obsidian.workspace.getPreviousFile(),
        };

        // Each resolver tries to resolve a template, returns undefined if
        // they cannot find a template
        let resolvers = [

            /**
             * Unique Note Creator
             * File name with format `YYYY-MMDD-HHmm`
             */
            (state) => {
                if (moment(
                        state.file.basename,
                        customJS.UniqueNoteCreator?.settings.format,
                        true
                    ).isValid()) {
                    return "note.fleeting";
                }
            },

            /**
             * [Package] Area (evergarden-area)
             * Area
             * File name starts with `a-`
             */
            (state) => {
                if (state.file.basename.startsWith("a-")) {
                    return "note.area";
                }
            },

            /**
             * [Package] Library (evergarden-library)
             * Book series
             * File name ends with ` (Series)`
             */
            (state) => {
                if (state.file.basename.endsWith(" (Series)")) {
                    return "note.library.series";
                }
            },

            /**
             * [Package] Periodic (evergarden-periodic)
             * Periodic Notes
             * File name with periodic formats, checkout `Periodic.js`
             */
            (state) => {
                let periodicType = customJS.Periodic?.getType(
                    state.file.basename
                );

                if (periodicType) {
                    return periodicType.template;
                }
            },

            /**
             * [Package] Project (evergarden-project)
             * Project Notes
             * Active note belongs to a project during the creation of new note,
             * usually triggered through link clicks in project notes
             */
            async (state) => {
                let templates = {
                    notes:   "note.project.notes",
                    meeting: "note.project.notes.meeting",
                };
                let project = customJS.Projects?.getProjectByFile(
                    state.prevFile
                );

                if (project) {
                    await customJS.Obsidian.vault.createFolder(project.notePath);

                    return (moment(state.file.basename,
                            "[meeting.]YYYY-MM-DD",
                            true
                        ).isValid())? templates.meeting : templates.notes;
                }
            },

            /**
             * [Package] Zettelkasten (evergarden-zettel)
             * Permanent Notes
             * Active file is permanent note during the creation of new note,
             * created through link clicks and creating new note from template
             */
            (state) => {
                if (customJS.Obsidian.file.getTags(state.prevFile)
                    ?.includes("#zettel/permanent")
                ) {
                    return "note.permanent";
                }
            },

            /**
             * Default template
             * When none of the above fits, usually trggered by Ctrl + N
             */
            async (state) => "note.default",
        ];

        // Go through every resolver, stops when a resolver succeeds
        for (const resolver of resolvers) {
            let template = await resolver(state);
            if (template) return template;
        }
    }
    
    /**
     * Creates a new file from template
     * @param {string} filePath - Path of the new file
     * @param {string|TFile} template - TFile or basename of the template
     * @returns {TFile} The created file
     */
    async createNewFileFromTemplate(filePath, template) {
        let folder, fileName;
        let matchGroups = filePath
            ?.match(/^((?<folder>.*)\/)?(?<fileName>.*?)(\.md)?$/)?.groups;
        if (matchGroups) {
            folder = matchGroups.folder;
            fileName = matchGroups.fileName;
        }

        if (!(template instanceof obsidian.TFile)) {
            template = this.getFile(template);
        }

        return await this.plugin.templater.create_new_note_from_template(
            template,
            folder,
            fileName,
            false  // processFrontMatter will be ignored if set to true
        );
    }

    /**
     * Insert template into active file
     * @param {string|TFile} template - TFile or basename of the template
     */
    async insertTemplateToActiveNote(template) {
        if (!(template instanceof obsidian.TFile)) {
            template = this.getFile(template);
        }

        // Insert template
        await this.plugin.templater.append_template_to_active_file(template);
    }

    /**
     * Overwrite target file with template
     * @param {string} filePath - Path of file to apply template upon
     * @param {string|TFile} template - TFile or basename of the template
     */
    async AppendFileWithTemplate(filePath, template) {
        if (!(template instanceof obsidian.TFile)) {
            template = this.getFile(template);
        }

        let targetTFile = customJS.Obsidian.vault.getFile(filePath);

        await this.plugin.templater.write_template_to_file(
            template,
            targetTFile
        );
    }

    /**
     * Wraps the tp object and provides additional functionality. All properties
     * and methods of tp can be accessed as usual.
     * 
     * @example
     * tp = Templater.wrap(tp);
     * tR += tp.date.now()  // Unaffected, tp object can be used as usual
     * 
     * @param {Record<string, unknown>} tp - Templater current_function_object
     * @returns {VioletTemplaterInlineAPI}
     */
    wrap(tp) {
        return new this.VioletTemplaterInlineAPI(tp);
    }
    
    VioletTemplaterInlineAPI = class {
        constructor(tp) {
            // tp is already wrapped, skip wrapping
            if (tp instanceof this.constructor) {
                return tp;
            }

            // Wrap tp
            Object.setPrototypeOf(this.__proto__, tp);
            this.file = Object.setPrototypeOf({}, tp.file);

            // Hijack this.file.include
            this.file.include = this.include;
        }

        /**
         * Parses a template with correct template_file set, returns parsed
         * content.
         * 
         * `tp.file.include()` won't update `tp.config.template_file`, accessing
         * `tp.config.template_file` within an included template will only get
         * the template at the top of include chain.
         * 
         * @param {string|TFile} template - TFile or wiki link, e.g., "[[templateName]]"
         * @param {boolean} notify - Notify include messages
         * @returns {string} Parsed template content
         */
        async include(template, notify = true) {
            const { Obsidian, VaultError, Templater } = await cJS();

            if (!(template instanceof obsidian.TFile)) {
                // Parse wikilink if template is not TFile
                let templateName = template.match(/^\[\[(.*)\]\]$/)?.[1];

                // Invalid templateLink
                if (!templateName) {
                    new Obsidian.Notice(
                        `<strong>${this.config.target_file.name}</strong>: Invalid file format, provide an obsidian link between quotes`
                    );
                    throw new VaultError(
                        `${this.config.target_file.name}: Invalid file format, provide an obsidian link between quotes`
                    );
                }

                // Templates doesn't exist
                if (!Templater.exists(templateName)) {
                    new Obsidian.Notice(
                        `<strong>${this.config.target_file.name}</strong>: Template <em>${template}</em> doesn't exist`
                    );
                    throw new VaultError(
                        `${this.config.target_file.name}: Template ${template} doesn't exist`
                    );
                }
                template = Templater.getFile(template);
            }

            // Notify the user of the template inclusion
            let currentTemplateFile = this.config.template_file;
            if (notify) {
                new Obsidian.Notice(
                    `<strong>${this.config.target_file.name}</strong>: Template <em>[[${currentTemplateFile.basename}]]</em> included <em>[[${template.basename}]]</em>`
                );
                console.log(
                    `%c${this.config.target_file.name}%c: Template %c[[${currentTemplateFile.basename}]]%c included %c[[${template.basename}]]`,
                    "font-weight:bold", "font-weight:initial", "font-style:italic", "font-style:initial", "font-style:italic"
                );
            }
            
            // Save and restore current template, so the code within the
            // template can know exactly what template they are in.
            this.config.template_file = template;
            let content = await this.__proto__.file.include(template);
            this.config.template_file = currentTemplateFile;

            return content;
        }

        /**
         * Set frontmatter of target file
         * 
         * WARNING
         * This operation will erase existing frontmatter
         * 
         * @param {Object<string, string>} properties - Dictionary of properties
         */
        setFrontMatter(properties) {
            // Prevent race condition between Templater and Obsidian
            this.hooks.on_all_templates_executed(() => {
                customJS.Obsidian.frontmatter.set(
                    this.config.target_file,
                    properties
                );
            });
        }

        /**
         * Add tags to target file's frontmatter tags list
         * @param {Array.<string>} tags - Tags to add in frontmatter
         */
        addTags(tags) {
            // Prevent race condition between Templater and Obsidian
            this.hooks.on_all_templates_executed(() => {
                customJS.Obsidian.frontmatter.addTags(
                    this.config.target_file,
                    tags
                );
            });
        }
    }

    TemplaterFuzzySuggester = class extends obsidian.FuzzySuggestModal {
        constructor(templaterPackage, runMode) {
            super(customJS.app);
            this.templater = templaterPackage;
            this.runMode = runMode;
            this.setPlaceholder("Find a template...");

            let instructions = [];
            if (runMode === this.templater.RunMode.CreateNewFromTemplate) {
                instructions = [
                    { command: "↵", purpose: "to create"},
                    { command: "ctrl ↵", purpose: "to create in new tab"},
                    { command: "ctrl alt ↵", purpose: "to create and split right"},
                ];
                this.scope.register(["Mod"], "Enter", (event) => {
                    this.selectActiveSuggestion(event);
                });
                this.scope.register(["Mod", "Alt"], "Enter", (event) => {
                    this.selectActiveSuggestion(event);
                });
            } else if (runMode === this.templater.RunMode.AppendActiveFile) {
                instructions = [
                    { command: "↵", purpose: "to insert"},
                ];
            } else {
                throw new Error("Templater suggester cannot run without runMode assigned.")
            }

            this.setInstructions([
                { command: "↑↓", purpose: "to navigate"},
                ...instructions,
                { command: "esc", purpose: "to dismiss"}
            ]);
        }

        getItems() {
            return this.templater.getUserTemplates();
        }

        getItemText(templateItem) {
            return templateItem.file.basename;
        }

        async onChooseItem(templateItem, event) {
            let newNote;
            switch (this.runMode) {
                case this.templater.RunMode.CreateNewFromTemplate:
                    newNote = await this.templater.createNewFileFromTemplate(
                        undefined,
                        templateItem.file
                    );
                    let mode = event.ctrlKey
                    ? (event.altKey? "split-right" : "new-tab")
                    : "current";
                    customJS.Obsidian.vault.openFile(newNote, mode);
                    break;
                case this.templater.RunMode.AppendActiveFile:
                    newNote = await this.templater.insertTemplateToActiveNote(
                        templateItem.file
                    );
                    break;
            }
        }
    }
}