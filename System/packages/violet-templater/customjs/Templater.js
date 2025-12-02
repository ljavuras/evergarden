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

    // Templater plugin settings
    pluginSettings = {
        folder: app.plugins.plugins["templater-obsidian"]
                .settings.templates_folder,
    };

    onload() {
        this.loadConfig();
        this.commands.forEach(cmd => this.addCommand(cmd));
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

    loadConfig() {
        this.loadSettings();

        this.config = { files: [], folders: [] };

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

        if (this.pluginSettings.folder) {
            this.config.folders.push({
                plugin: "templater-obsidian",
                path: this.pluginSettings.folder
            })
        }
    }

    /**
     * Get all templates, including deprecated, system and update templates
     * @returns {Object[]}
     */
    getAllTemplates(refresh = false) {
        // Cache hit
        if (!refresh && this.allTemplates) { return this.allTemplates; }

        let templateItems = this.config.files.map(
            item => {
                item.file = customJS.Obsidian.vault.getFile(item.path);
                delete item.path;
                return item;
            }
        );
        let inFolderTemplates = this.config.folders.reduce(
            (templates, folderItem) => {
                return templates.concat(
                    customJS.Obsidian.vault
                    .getFilesFromFolder(folderItem.path)
                    .map(templateFile => {
                        let templateItem = Object.assign({}, folderItem);
                        templateItem.file = templateFile;
                        delete templateItem.path;
                        return templateItem;
                    })
                )
            }, []
        )
        templateItems = templateItems.concat(inFolderTemplates);
        templateItems.sort((aItem, bItem) => {
            return aItem.file.basename.localeCompare(bItem.file.basename);
        });
        this.allTemplates = templateItems;
        return templateItems;
    }
    
    /**
     * Get templates meant to be used by users
     * @returns {Object[]}
     */
    getUserTemplates() {
        return this.getAllTemplates().filter((item) => {
            let name = item.file.basename;
            return !(name.startsWith("bug.")  // Bug demo
                || name.startsWith("depr.")  // Deprecated
                || name.startsWith("system.")  // System templates
                || name.match(/\.update\.\d+$/)  // Updater templates
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
        return this.getAllTemplates().find(
            (item => item.file.basename.localeCompare(templateName) === 0)
        ).file;
    }

    getInfo(templateName) {
        return customJS.Script.get(
            this.getFile(templateName)
        );
    }

    exists(templateName) {
        return this.getAllTemplates().some(
            (item) => item.file.basename.localeCompare(templateName) === 0
        );
    }

    /**
     * Returns a template based on current state
     * @returns {string} - Template name
     */
    async resolveTemplate(running_config) {

        let state = {
            targetFile:   running_config.target_file,
            previousFile: customJS.Obsidian.workspace.getPreviousFile(),
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
                        state.targetFile.basename,
                        customJS.UniqueNoteCreator.settings.format,
                        true
                    ).isValid()) {
                    return "note.fleeting";
                }
            },

            /**
             * Area
             * File name starts with `a-`
             */
            (state) => {
                if (state.targetFile.basename.startsWith("a-")) {
                    return "note.area";
                }
            },

            /**
             * Book series
             * File name ends with ` (Series)`
             */
            (state) => {
                if (state.targetFile.basename.endsWith(" (Series)")) {
                    return "note.library.series";
                }
            },

            /**
             * Periodic Notes
             * File name with periodic formats, checkout `customJS.Periodic`
             */
            (state) => {
                let periodicType = customJS.Periodic.getType(
                    state.targetFile.basename
                );

                if (periodicType) {
                    return periodicType.template;
                }
            },

            /**
             * Project Notes
             * Active note belongs to a project during the creation of new note,
             * usually triggered through link clicks in project notes
             */
            async (state) => {
                let templates = {
                    notes:   "note.project.notes",
                    meeting: "note.project.notes.meeting",
                };
                let project = customJS.Projects.getProjectByFile(
                    state.previousFile
                );

                if (project) {
                    await customJS.Obsidian.vault.createFolder(project.notePath);

                    return (moment(state.targetFile.basename,
                            "[meeting.]YYYY-MM-DD",
                            true
                        ).isValid())? templates.meeting : templates.notes;
                }
            },

            /**
             * Permanent Notes
             * Active file is permanent note during the creation of new note,
             * created through link clicks and creating new note from template
             */
            (state) => {
                if (customJS.Obsidian.file.getTags(state.previousFile)
                    ?.includes("#zettel/permanent")
                ) {
                    return "note.permanent";
                }
            },

            /**
             * Default template
             * When none of the above fits, usually trggered by Ctrl + N
             */
            async (state) => {
                return "note.default";
            }
        ];

        // Go through every resolver, stops when a resolver succeeds
        for (const resolver of resolvers) {
            let template = await resolver(state);
            if (template) { return template; }
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
    async apply(filePath, template) {
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
     * Checks if a note can be updated
     * @param {TFile} file - Target note to be updated
     * @returns {String} status of updater availability
     */
    async tryUpdate(file) {
        const {name, version} = customJS.Script.template.getInfo(file);

        // No template assigned
        if (!name) {
            return "missing-template";
        }

        // Missing version number
        if (!version) {
            return "missing-version";
        }

        // Note version is latest or next
        if (version == "next" ||
            version >= await this.getInfo(name).getVersion()) {
            return "latest";
        }

        // Template updater doesn't exist
        const updateTemplate = `${name}.update.${version}`;
        if (!this.exists(updateTemplate)) {
            return "missing-updater";
        }

        return "update-available";
    }

    /**
     * Update a note layout to match latest template design
     * @param {TFile} file - Target note to update
     * @todo tryUpdate() should run within update()
     */
    async update(file) {
        await this.apply(file.path, "system.update");
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