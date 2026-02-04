/**
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

class Templates extends VPS.Package {
    getFrontmatterKey(setting) {
        return this.config.frontmatter[setting];
    }

    getOpenTemplateApp() {
        return this.config.openTemplateWith;
    }

    onload() {
        this.loadSettings();
        this._buildConfig();
        this.registerEvent(this.settings.on("update", (packageId, update) => {
            if (packageId === this.packageId)
                Object.assign(this.config, update);
        }));
        this.onPackageReady("violet-templater", "Templater", (Templater) => {
            this.Templater = Templater;
        });
        this._registerUpdaterCreate();
        this.addSettingTab(new this.EvergardenTemplatesSettingTab(this.app, this));
    }

    _buildConfig() {
        const settings = this.settings;
        const DEFAULT_CONFIG = {
            openTemplateWith: "obsidian",
            frontmatter: {
                template: "template/name",
                templateVersion: "template/version",
            },
        };

        let parser, composer;
        const checkParser = (file) => {
            if (parser) return;
            if (file.basename === settings.templates.parser) parser = file;
        }
        const checkComposer = (file) => {
            if (composer) return;
            if (file.basename === settings.templates.composer) composer = file;
        }
        settings?.friend?.['violet-templater']?.files?.forEach((path) => {
            const file = this.app.vault.getFileByPath(`${this.path}/${path}`);
            if (!file instanceof obsidian.TFile) return;
            checkParser(file);
            checkComposer(file);
        });
        settings?.friend?.['violet-templater']?.folders?.forEach((path) => {
            const folder = this.app.vault.getFolderByPath(`${this.path}/${path}`);
            if (!folder instanceof obsidian.TFolder) return;
            obsidian.Vault.recurseChildren(folder, (file) => {
                checkParser(file);
                checkComposer(file);
            });
        });

        this.config = Object.assign(
            DEFAULT_CONFIG,
            {
                openTemplateWith: settings.openTemplateWith,
                frontmatter: {
                    template: settings.template.key,
                    templateVersion: settings.templateVersion.key,
                },
                templates: { parser, composer },
            }
        );
    }

    /**
     * Handle parser and composer create, because violet-templater will skip if
     * target file itself is a template.
     */
    _registerUpdaterCreate() {
        this.registerEvent(this.app.vault.on('create', async (file) => {
            let template;
            if (file.basename.match(/\.parse\.(\d+)$/)) {
                template = this.config.templates.parser;
            } else if (file.basename.match(/\.compose\.(\d+)$/)) {
                template = this.config.templates.composer;
            }
            if (!template) return;
            await this.Templater.plugin.templater.write_template_to_file(
                template,
                file
            );
        }));
    }

    /**
     * Fetches necessary info for a file to update, or error message.
     * @param {TFile | string} file - TFile or path of the file to update.
     * @param {number} [targetVersion] - Try update to this version.
     * @returns {Promise<object>} Parser and composer templates or error message
     */
    async tryUpdate(file, targetVersion) {
        const formatMessage = (message) => (
            "[Package] evergarden-templates\n" +
            "Templates.tryUpdate: " +
            message
        );
        if (!this.Templater) throw new Error(formatMessage(
            "Cannot execute without package violet-templater available."
        ));

        if (!(file instanceof obsidian.TFile)) {
            if (typeof file === "string") {
                file = app.vault.getFileByPath(file);
                if (!file) return {
                    success: false,
                    message: formatMessage(`File doesn't exist: ${file}.`),
                };
            } else {
                return {
                    success: false,
                    message: formatMessage("Invalid argument: file."),
                };
            }
        }

        const settings = this.config;
        const metadata = this.app.metadataCache.getFileCache(file);

        const link = metadata.frontmatterLinks
            ?.find(link => link.key === settings.template.key);
        if (!link) return {
            success: false,
            message: formatMessage(
                `${file.path} missing frontmatter: ${settings.template.key}.`
            ),
        };

        const version = metadata.frontmatter?.[settings.templateVersion.key];
        if (!version) return {
            success: false,
            message: formatMessage(
                `${file.path} missing frontmatter: ${settings.templateVersion.key}.`
            ),
        };
        const parser = this.Templater.getFile(`${link.link}.parse.${version}`);
        if (!parser) return {
            success: false,
            message: formatMessage(
                `Missing parser: ${link.link}.parse.${version}.`
            ),
        };

        if (targetVersion) {
            const composer = this.Templater.getFile(
                `${link.link}.compose.${targetVersion}`
            );
            if (!composer) return {
                success: false,
                message: formatMessage(
                    `Missing composer: ${link.link}.compose.${targetVersion}.`
                ),
            };
            return { success: true, parser, composer };
        }


        const templateFile = this.app.metadataCache.getFirstLinkpathDest(
            link.link,
            file.path
        );
        // Template exists, use template version as update target version
        if (templateFile) {
            const { Script } = await cJS();
            const latestVersion = await Script.get(templateFile).getVersion();
            if (!latestVersion) return null;
            const composer = this.Templater.getFile(
                `${link.link}.compose.${latestVersion}`
            );
            if (!composer) return {
                success: false,
                message: formatMessage(
                    `Missing composer: ${link.link}.compose.${latestVersion}.`
                ),
            };
            return { success: true, parser, composer };
        }

        // Template doesn't exist, find latest version of existing composers
        const composerRegex = new RegExp(`^${link.link}.compose.(\\d+)$`);
        const composer = this.Templater.getAllTemplates()
            .filter(templateItem => {
                const version = templateItem.file.basename
                    .match(composerRegex)?.[1];
                if (version) templateItem.version = Number(version);
                return !!version;
            })
            .reduce((acc, templateItem) => {
                if (!acc) return null;
                return acc.version > templateItem.version? acc : templateItem;
            }, null);
        if (!composer) return {
            success: false,
            message: formatMessage(
                `Missing composer: ${link.link}.compose.*.`
            ),
        };
        if (composer.version <= version) return {
            success: false,
            message: formatMessage(
                `File is up to date: ${file.path}.`
            )
        }
        return { success: true, parser, composer };
    }

    async update(file, targetVersion) {
        const {
            success,
            message,
            parser,
            composer
        } = (await this.tryUpdate(file, targetVersion)) ?? {};

        if (!success) {
            new obsidian.Notice(message);
            console.warn(message);
            return;
        }

        // https://github.com/SilentVoid13/Templater/blob/80a4b3d6d2c0321ab9243a82974d624e121a3fb5/src/core/Templater.ts#L396-L420
        const { templater } = this.Templater.plugin;
        templater.start_templater_task(file.path);
        // Execute parser, store parsed content in `tp`
        await templater.read_and_parse_template(
            templater.create_running_config(
                parser,
                file,
                this.Templater.RunMode.OverwriteFile
            )
        );
        // Prepare `tp` for composer without deleting parse content in `tp`
        Object.assign(
            templater.current_functions_object,
            await templater.functions_generator.generate_object(
                templater.create_running_config(
                    composer,
                    file,
                    this.Templater.RunMode.OverwriteFile
                ),
                this.Templater.FunctionsMode.USER_INTERNAL
            ),
        );
        // Execute composer
        const updatedContent = await templater.parser.parse_commands(
            await this.app.vault.cachedRead(composer),
            templater.current_functions_object
        );
        // Overwrite file with composer's result
        this.app.vault.modify(file, updatedContent);
        await templater.end_templater_task(file.path);
    }

    getTemplates() {
        return new Set(this.Templater.getTemplates());
    }

    getUserTemplates() {
        const userTemplates = new Set();
        this.getTemplates().forEach(item => {
            const name = item.file.basename;
            const isUserTemplate = !(name.startsWith("bug.")  // Bug demo
                || name.startsWith("depr.")  // Deprecated
                || name.startsWith("system.")  // System templates
                || name.match(/\.update\.\d+$/)  // Updater templates
                || name.match(/\.parse\.\d+$/)  // Parser
                || name.match(/\.compose\.\d+$/)  // Composer
            );
            if (isUserTemplate) userTemplates.add(item);
        });
        return userTemplates;
    }

    getParsers() {
        const parserTemplates = new Set();
        this.getTemplates().forEach(item => {
            if (item.file.basename.match(/\.parse\.\d+$/))
                parserTemplates.add(item);
        });
        return parserTemplates;
    }

    getComposers() {
        const composerTemplates = new Set();
        this.getTemplates().forEach(item => {
            if (item.file.basename.match(/\.compose\.\d+$/))
                composerTemplates.add(item);
        });
        return composerTemplates;
    }

    wrap(tp) {
        tp = this.Templater.wrap(tp);
        tp = new this.EvergardenTemplatesInlineAPI(tp);
        tp.Templates = this;
        return tp;
    }

    EvergardenTemplatesInlineAPI = class {
        constructor(tp) {
            // tp is already wrapped, skip
            if (tp instanceof this.constructor) return tp;

            Object.setPrototypeOf(this.__proto__, tp);
        }

        setParsed(parsed) {
            this.__proto__.__proto__.__proto__.__proto__.parsed = Object.assign(
                this.__proto__.__proto__.__proto__.__proto__.parsed ?? {},
                { [this.config.target_file.path]: parsed }
            );
        }

        getParsed() {
            return this.parsed?.[this.config.target_file.path];
        }

        setVersion() {
            const version = Number(
                this.config.template_file.basename
                    .match(/.+\.compose\.(\d+)$/)?.group[1]
            );
            if (Number.isNaN(version)) {
                throw new Error(
                    "[Package] evergarden-templates:\n" +
                    "EvergardenTemplatesInlinAPI.setVersion: Failed to parse version number from template file."
                );
            }
            this.setFrontMatter({
                [this.Templates.getFrontmatterKey('templateVersion')]: version,
            });
        }
    }

    EvergardenTemplatesSettingTab = class EvergardenTemplatesSettingTab extends VPS.PackageSettingTab {
        constructor(app, packageInstance) {
            super(app, packageInstance);
        }

        display() {
            function replaceEventListener(text) {
                // Avoid fire `onChange` for every keystroke
                const originalInputEl = text.inputEl;
                text.inputEl = originalInputEl.parentElement.createEl(
                    'input', {
                        type: "text"
                    }
                );
                text.inputEl.addEventListener("change", text.onChanged.bind(text));
                text.inputEl.setAttribute("spellcheck", "false");
                originalInputEl.remove();
            }

            const { containerEl } = this;
            containerEl.empty();

            new obsidian.SettingGroup(containerEl)
                .addSetting(setting => {
                    setting
                        .setName("App for opening templates")
                        .setDesc("Select the app to open templates with.")
                        .addDropdown(dropdown => {
                            const instance = this.packageInstance;
                            const settings = instance.settings;
                            dropdown
                                .addOptions({
                                    obsidian: "Obsidian",
                                    vscode: "Visual Studio Code",
                                })
                                .setValue(settings.openTemplateWith)
                                .onChange(async (value) => {
                                    settings.openTemplateWith = value;
                                    await instance.saveSettings(settings);
                                })
                        })
                })

            new obsidian.SettingGroup(containerEl)
                .setHeading("Frontmatter")
                .addSetting(setting => {
                    setting
                        .setName("Template link")
                        .setDesc("Name of the property used to store a link to the template that generated the note.")
                        .addText(text => {
                            replaceEventListener(text);
                            const instance = this.packageInstance;
                            const settings = instance.settings;
                            text.setPlaceholder("Property name")
                                .setValue(settings.template.key)
                                .onChange(async (value) => {
                                    settings.template.key = value;
                                    await instance.saveSettings(settings);
                                });
                        })
                })
                .addSetting(setting => {
                    setting
                        .setName("Template version")
                        .setDesc("Name of the property used to store the template version at the time the note was generated.")
                        .addText(text => {
                            replaceEventListener(text);
                            const instance = this.packageInstance;
                            const settings = instance.settings;
                            text.setPlaceholder("Property name")
                                .setValue(settings.templateVersion.key)
                                .onChange(async (value) => {
                                    settings.templateVersion.key = value;
                                    await instance.saveSettings(settings);
                                });
                        })
                })

            new obsidian.SettingGroup(containerEl)
                .setHeading("Updater templates")
                .addSetting(setting => {
                    setting
                        .setName("Parser template")
                        .setDesc("File to be used as a Templater template for parser templates.")
                        .addSearch(search => {
                            replaceEventListener(search);
                            const instance = this.packageInstance;
                            const settings = instance.settings;
                            search
                                .setPlaceholder("Template file")
                                .setValue(settings.templates.parser)
                                .onChange(async (value) => {
                                    settings.templates.parser = value;
                                    await instance.saveSettings(settings);
                                })
                        })
                })
                .addSetting(setting => {
                    setting
                        .setName("Composer template")
                        .setDesc("File to be used as a Templater template for composer templates.")
                        .addSearch(search => {
                            replaceEventListener(search);
                            const instance = this.packageInstance;
                            const settings = instance.settings;
                            search
                                .setPlaceholder("Template file")
                                .setValue(settings.templates.composer)
                                .onChange(async (value) => {
                                    settings.templates.composer = value;
                                    await instance.saveSettings(settings);
                                })
                        })
                })
        }
    }
}