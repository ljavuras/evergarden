/**
 * Wrapper for Obsidian API
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */
class Obsidian {

    file = {
        getTags(file) {
            return customJS.obsidian.getAllTags(
                app.metadataCache.getFileCache(file)
            );
        },

        getBackLinks(file) {
            return app.metadataCache.getBacklinksForFile(file);
        }
    };

    /**
     * Vault related Obsidian API
     */
    vault = {

        // Special characters that aren't allowed for filename in Obsidian:
        // *"\/<>:|?#^[]
        specialCharSet      : "*\"\\/<>:|?#^[]",
        specialCharSetRegex : /[*"\\/<>:|?#^[\]]/,

        /**
         * Checks if a string is a valid filename in Obsidian
         * @param {string} filename - Name of a potential new file
         * @returns {boolean}
         */
        isValidFilename(filename) {
            return !this.specialCharSetRegex.test(filename);
        },

        /**
         * Checks if a file at a given path exists
         * @param {String} filePath - Path of a file
         * @returns {Boolean} Returns true if file exists
         */
        existsFile(filePath) {
            filePath = obsidian.normalizePath(filePath);
            return app.vault.getAbstractFileByPath(filePath) instanceof obsidian.TFile;
        },

        /**
         * Returns a TFile given a file path
         * @param {string} filePath - Path of the file
         * @returns {TFile}
         * 
         * @todo Handle file extension (w/ or w/o ".md")
         */
        getFile(filePath) {
            filePath = obsidian.normalizePath(filePath);

            let file = app.vault.getAbstractFileByPath(filePath);
            if (!(file instanceof obsidian.TFile)) {
                throw new customJS.VaultError(`${filePath} is not a file.`)
            }

            return file;
        },

        /**
         * Gets a best matching TFile by file name
         * @param {string} fileName - Name of file, w/ or w/o extension
         * @returns {TFile} Obsidian TFile object
         */
        getFileByName(fileName) {
            // TODO: handle error
            return app.metadataCache.getFirstLinkpathDest(fileName, "");
        },

        /**
         * Get contents of a file
         * @param {string | TFile} file - Path or object of a file
         * @param {Boolean} stripYAML - Strip frontmatter if true
         * @returns {string} Contents of the file
         */
        async getFileContent(fileId, stripYAML = true, readOnly = true) {
            let tfile;

            // fileId is a path
            if (typeof fileId == 'string') {
                tfile = this.getFile(fileId);

            // fileId is TFile
            } else if (fileId instanceof obsidian.TFile) {
                tfile = fileId;

            // Handle error
            } else {
                throw new customJS.VaultError(
                    "Cannot get file content.\n" +
                    "Invalid parameter passed to Obsidian.getFileContent"
                )
            }

            let fileContent = readOnly
                ? await app.vault.cachedRead(tfile)
                : await app.vault.read(tfile);
            if (stripYAML) {
                fileContent = fileContent.replace(/^---\v.*?\v---\v/s, "");
            }
            return fileContent;
        },

        existsFolder(folderPath) {
            folderPath = obsidian.normalizePath(folderPath);
            return app.vault.getAbstractFileByPath(folderPath) instanceof obsidian.TFolder;
        },

        getFolder(folderPath) {
            return app.vault.getFolderByPath(folderPath);
        },

        /**
         * Gets all files under the folder
         * @param {string|TFolder} folder - Search for files under this folder
         * @returns {TFile[]}
         */
        getFilesFromFolder(folder) {
            if (!(folder instanceof obsidian.TFolder)) {
                folder = this.getFolder(folder);
            }
            const tFiles = [];
            obsidian.Vault.recurseChildren(folder, (file) => {
                if (file instanceof obsidian.TFile) {
                    tFiles.push(file);
                }
            });
            return tFiles;
        },

        /**
         * Creates a folder if the folder doesn't exist
         * @param {string} folderPath - Path of the folder
         */
        async createFolder(folderPath) {
            if (!this.existsFolder(folderPath)) {
                await app.vault.createFolder(folderPath);
            }
        },

        /**
         * Opens a file in editor, creates the file if it doesn't exist
         * @param {TFile|string} file - File or path to be opened in editor
         * @param {string} mode - Open mode, see options in `modeMap`
         */
        async openFile(file, mode = "current") {
            let modeMap = {
                "current":     [false],
                "new-tab":     [true],
                "split-right": ["split"],
                "split-down":  ["split", "horizontal"],
                "new-window":  ["window"],
            };

            // file type check
            if (!(file instanceof obsidian.TFile) &&
                typeof file != "string") {
                throw new customJS.VaultError(
                    "file should either be type TFile or string, but it is type " +
                    typeof file + "."
                );
            }

            // Get TFile from path
            if (typeof file == "string") {
                if (!this.existsFile(file)) {
                    file = await app.vault.create(file, '');
                } else {
                    file = app.vault.getAbstractFileByPath(file);
                }
            }

            // Open file with appropriate mode
            let activeLeaf = app.workspace.getLeaf(...modeMap[mode]);
            await activeLeaf.openFile(file);
        },

        /**
         * Gets a list of files under a folder
         * @param {string} folderPath - Path to the folder
         * @param {string} options
         * @returns Files and folders under the path
         */
        async list(folderPath, options = "all") {
            let filenames = await app.vault.adapter.list(folderPath);

            let folders = filenames.folders.map((path) => {
                return app.vault.getAbstractFileByPath(path);
            });

            let files = filenames.files.map((path) => {
                return app.vault.getAbstractFileByPath(path);
            });

            switch (options) {
                case "all":
                    return {folders: folders, files: files}
                case "folder":
                    return folders;
                case "file":
                    return files;
                default:
                    throw new customJS.VaultError(
                        "Invalid option passed to Obsidian.list\n" +
                        "options can only be: all, folder, file"
                    );
            }
        },
    };

    /**
     * Workspace related Obsidian API
     */
    workspace = {

        /**
         * Returns most recently active file
         * @returns {TFile}
         */
        getActiveFile() {
            return app.workspace.getActiveFile();
        },

        /**
         * Returns previous in the history of active view
         * @returns {TFile}
         */
        getPreviousFile() {
            return app.vault.getAbstractFileByPath(
                app.workspace.getLastOpenFiles()[1]
            );
        },

        /**
         * Returns the workspace leaf of a file in workspace
         * @param {string} filePath - Path of the file
         * @returns {WorkspaceLeaf}
         */
        getLeafByFilePath(filePath) {
            // Iterate through layout tree and extract the leaves
            function extractLeafs(layoutTree) {
                if (layoutTree.type === "leaf") {
                    return layoutTree;
                }
                return layoutTree.children.reduce((acc, child) => {
                    return acc.concat(extractLeafs(child));
                }, []);
            }

            // Get all views from left, main and right of Obsidian workspace
            let leaves = Object.entries(app.workspace.getLayout())
                .reduce((leaves, entry) => {
                    if (['left', 'main', 'right'].includes(entry[0])) {
                        leaves = leaves.concat(extractLeafs(entry[1]));
                    }
                    return leaves;
                }, []);

                let leafId = leaves?.find(
                leaf => leaf.state.state.file.localeCompare(filePath) === 0
            )?.id;

            if (leafId) {
                return app.workspace.getLeafById(leafId);
            }
        }
    };

    frontmatter = {
        /**
         * Set frontmatter of a file
         * 
         * @param {TFile} file - Target file
         * @param {Object.<string, string>} properties - Dictionary of properties
         * 
         * @example
         * // Add delay or hook to prevent race condition between Templater and
         * // Obsidian API.
         * tp.hooks.on_all_templates_executed(async () => {
         *     customJS.Obsidian.frontmatter.set(tp.config.target_file, {
         *         property1: 'value1',
         *         property2: 'value2',
         *     });
         * });
         * 
         * @todo handle exceptions
         */
        set(file, properties) {
            app.fileManager.processFrontMatter(
                file,
                (frontmatter) => {
                    for (const [property, value] of Object.entries(properties)) {
                        frontmatter[property] = value;
                    }
                }
            );
        },

        get(file) {
            return app.metadataCache.getFileCache(file)?.frontmatter;
        },

        /**
         * Rename a property of target file
         * @param {TFile} file - Target file
         * @param {String} property - Property to rename
         * @param {String} newProperty - New property name
         */
        rename(file, property, newProperty) {
            app.fileManager.processFrontMatter(
                file,
                (frontmatter) => {
                    Object.defineProperty(frontmatter, newProperty,
                        Object.getOwnPropertyDescriptor(frontmatter, property)
                    );
                    delete frontmatter[property];
                }
            )
        },

        /**
         * Push an array of values into a property, if the property is a string,
         * it will turn it into an array.
         * 
         * Takes care of nested structure, e.g., tags, avoids duplicated values
         * @param {TFile} file - Target file
         * @param {String} property - Property name to push into
         * @param {Array.<string>} values - Values to push into property
         * @param {Boolean} isNested - Has nested structure like tags
         */
        addList(file, property, values, isNested = false) {
            app.fileManager.processFrontMatter(
                file,
                (frontmatter) => {
                    if (!frontmatter[property]) {
                        frontmatter[property] = values;
                        return;
                    } else if (typeof frontmatter[property] !== 'string'
                            && !Array.isArray(frontmatter[property])) {
                        // TODO: Handle type error
                    }
                    if (typeof frontmatter[property] === 'string') {
                        frontmatter[property] = [frontmatter[property]];
                    }

                    // Concat two arrays and eliminate duplicates
                    if (isNested) {
                        // E.g., ['note/issue', 'note'] => ['note/issue']
                        values = values.filter((new_value) => {
                            return !frontmatter[property].some((present_value) => {
                                return present_value.startsWith(new_value);
                            });
                        });

                        frontmatter[property] = frontmatter[property]
                            .filter((present_value) => {
                                return !values.some((new_value) => {
                                    return new_value.startsWith(present_value);
                                })
                            });

                        frontmatter[property] = frontmatter[property].concat(values);
                    } else {
                        // Create unique array
                        frontmatter[property] = [...new Set(
                            [...frontmatter[property], ...values]
                        )];
                    }
                }
            );
        },

        /**
         * Add tags to frontmatter of a file, accepts an array of tags, or a
         * single tag as string
         * @param {TFile} file - Target file
         * @param {Array.<String>|String} tags - Tags to add in frontmatter
         * 
         * @example
         * // Add delay or hook to prevent race condition between Templater and
         * // Obsidian API.
         * tp.hooks.on_all_templates_executed(async () => {
         *     customJS.Obsidian.frontmatter.add(
         *         tp.config.target_file,
         *         ['tag1', 'tag2']
         *     );
         * });
         */
        addTags(file, tags) {
            if (typeof tags === 'string' || tags instanceof String) {
                tags = [tags];
            } else if (!Array.isArray(tags)) {
                // tags is neither a string or an array
                // TODO: throw error
                return;
            }
            this.addList(
                file,
                "tags",
                tags.map(tag => tag.replace(/^#?(.*)$/, "$1")),  // Trim #
                true
            );
        },

        /**
         * Gets a link object from a frontmatter link
         * @param {TFile} file - Target file
         * @param {String} property - Property name
         * @returns {Obsidian.Link}
         */
        getLink(file, property) {
            let linkRef = app.metadataCache.getFileCache(file)
                ?.frontmatterLinks
                .find(fl => fl.key == property);
            
            if (linkRef) {
                return new customJS.Obsidian.Link().fromReference(linkRef)
            }
        },
    };

    /**
     * Renders markdown to a container
     * @param {String} markdown - Markdown content
     * @param {HTMLElement} containerEl - Container of the rendered markdown
     * @param {String} sourcePath - Path used to resolve relative internal links
     * @param {obsidian.Component} component - Parent component to manage the
     * lifecycle of the rendered child components.
     * @param {Boolean} inline - Remove margin if rendered inline
     */
    renderMarkdown(markdown, containerEl, sourcePath, component, inline = true) {
        if (!containerEl) return;

        containerEl.innerHTML = "";
        obsidian.MarkdownRenderer.renderMarkdown(markdown, containerEl, sourcePath, component)
            .then(() => {
                if (!containerEl || !inline) return;

                // Unwrap any created paragraph elements if we are inline.
                let paragraph = containerEl.querySelector("p");
                while (paragraph) {
                    let children = paragraph.childNodes;
                    paragraph.replaceWith(...Array.from(children));
                    paragraph = containerEl.querySelector("p");
                }
            });
    }

    /**
     * @todo Support markdown link & external link
     */
    Link = class {
        /**
         * @param {TFile} file - File the link links to
         * @param {String} sourcePath - Path where the link links from
         * @param {String} displayText - Alternative display text
         */
        constructor(file, sourcePath = "", displayText) {
            this.file = file;
            this.sourcePath = sourcePath;
            this.displayText = displayText;
        }

        /**
         * Constructs a link from path, even if the target path doesn't exist.
         * Use this method for unresolved links.
         * @param {String} path - Path the link links to
         * @param {String} sourcePath - Path the link links from
         * @param {String} displayText - Alternative display text
         * @returns {Obsidian.Link}
         */
        fromPath(path, sourcePath = "", displayText) {
            this.path = path;
            this.file = app.metadataCache.getFirstLinkpathDest(path, sourcePath);
            this.sourcePath = sourcePath;
            this.displayText = displayText;
            return this;
        }

        /**
         * Construct a Link from link string
         * @param {String} string - Link string, e.g., "[[file name]]"
         * @param {String} sourcePath - Path the link links from
         * @returns {Obsidian.Link}
         */
        fromString(string, sourcePath = "") {
            const { link, display } =
                /!?\[\[(?<link>[^|\]]*)(\|(?<display>[^\]]*))?\]\]/
                .exec(string).groups;

            this.file = app.metadataCache.getFirstLinkpathDest(
                link,
                this.sourcePath
            );
            if (!this.file) {
                this.path = link;  // Unresolved link
            }
            this.sourcePath = sourcePath;
            this.displayText = display;
            this.original = string;
            return this;
        }

        /**
         * Constructs a Link from reference object
         * @param {Object} reference - Obsidian Reference object,
         *     https://docs.obsidian.md/Reference/TypeScript+API/Reference
         * @param {String} reference.displayText
         * @param {String} reference.link
         * @param {String} reference.original
         * @param {String} sourcePath - Path the link links from
         * @returns {Obsidian.Link}
         */
        fromReference(reference, sourcePath = "") {
            this.file = app.metadataCache.getFirstLinkpathDest(
                reference.link,
                this.sourcePath
            );
            if (!this.file) {
                this.path = reference.link;  // Unresolved link
            }
            this.sourcePath = sourcePath;
            this.displayText = reference.link != reference.displayText?
                reference.displayText : undefined;
            this.original = reference.original;
            return this;
        }
        
        /**
         * Set sourcePath and returns itself for chaining
         * @param {String} sourcePath - Path where the link displays from
         * @returns {Obsidian.Link}
         */
        setSourcePath(sourcePath) {
            this.sourcePath = sourcePath;
            return this;
        }

        /**
         * Set displayText and returns itself for chaining
         * @param {String} displayText - Alternative text display
         * @returns {Obsidian.Link}
         */
        setDisplayText(displayText) {
            this.displayText = displayText;
            return this;
        }

        /**
         * Returns Obsidian flavored markdown wikilink
         * @returns {String}
         */
        toString() {
            let linkText = app.metadataCache.fileToLinktext(
                this.file,
                this.sourcePath
            );
            
            let displayText =
                (this.displayText == linkText)   ? undefined:
                this.displayText                 ? this.displayText:
                (this.file.basename != linkText) ? this.file.basename:
                                                   undefined;
            
            return "[["
                + linkText
                + (displayText? `|${displayText}` : '')
                + "]]";
        }

        /**
         * Returns an <a> element
         * @param {Boolean} removeContent - Removes text if true
         * @returns {HTMLAnchorElement}
         */
        toAnchor(removeContent = false) {
            let linkText = this.file?
                app.metadataCache.fileToLinktext(this.file, this.sourcePath):
                this.path;  // Unresolved link
            
            let displayText = this.displayText ?? linkText;

            return createFragment().createEl("a", {
                attr: {
                    ...(this.displayText && { 'data-tooltip-position': "top" }),
                    ...(this.displayText && { 'aria-label': linkText }),
                    'data-href': linkText,
                    target: "_blank",
                    rel: "noopener"
                },
                href: linkText,
                cls: "internal-link" + (!this.file? " is-unresolved" : ""),
                text: removeContent? null : displayText,
            });
        }

        /**
         * Returns true if two links points to the same file
         * @param {Obsidian.Link} link - The link to compare with this link
         * @returns {Boolean}
         */
        equals(link) {
            if (this.file) {
                return this.file.path == link.file?.path;
            } else {
                // Unresolved link
                return this.path
                    && this.path == link.path;
            }
        }
    }

    /**
     * Creates InputPromptModal that is identical to Obsidian native prompt
     *
     * @example
     * const date = await (
     *     new Obsidian.InputPromptModal(
     *         "submit date",
     *         "Date",
     *         today.toFormat("y-LL-dd")
     *     )
     * )
     * .getInput();
     */
    InputPromptModal = class extends obsidian.Modal {

        /**
         * Generates HTMLElemnts, and opens the modal
         * @param {string} submitPurpose - Description of submission purpose
         * @param {string} placeholder - Placeholder text
         * @param {string} prefill - Prefill input with text
         */
        constructor(
            submitPurpose = "enter",
            placeholder   = "Input text",
            prefill       = ""
        ) {
            super(app);
            this.modalEl.empty();
            this.modalEl.className = "prompt";

            let inputContainerEl = this.modalEl.createDiv("prompt-input-container");
            this.inputEl = inputContainerEl.createEl("input", {
                cls: "prompt-input",
                type: "text",
                value: prefill,
                placeholder: placeholder
            });
            inputContainerEl.createDiv("search-input-clear-button")
            .onclick = () => { this.close(); }

            let instructionsEl = this.modalEl.createDiv("prompt-instructions");

            [
                {command: "↵", description: `to ${submitPurpose}`},
                {command: "esc", description: "to dismiss"}
            ]
            .forEach((instruction) => {
                const instructionEl = instructionsEl.createDiv("prompt-instruction");
                instructionEl.createSpan({
                    cls: "prompt-instruction-command",
                    text: instruction.command
                });
                instructionEl.createSpan({ text: instruction.description });
                
            });

            // Open the modal
            this.open();
        }

        onOpen() {
            this.inputEl.focus();
            this.inputEl.addEventListener("keydown", this.inputListener);
        }

        onClose() {
            this.inputEl.removeEventListener("keydown", this.inputListener);
        }

        /**
         * Listen for keydown event, submit input if enter is pressed
         */
        inputListener = function (event) {
            if (event.key == "Enter") {
                // Intercept event
                event.preventDefault();

                // Emit inputPromptSubmit event
                this.inputEl.dispatchEvent(new Event("inputPromptSubmit"));
                this.close();
            }
        }.bind(this);

        /**
         * Returns user input after user submits an input
         * @returns {string} User input from InputPromptModal
         * @todo Cancelling the modal should also return a value. Currently,
         *       cancelling would straight up cancel execution of code after
         *       after this function.
         */
        async getInput() {

            // A promise that will resolve after user submits an input
            return new Promise((resolve, reject) => {

                // Calls resolve() on inputPromptSubmit event
                const submitListener = function () {
                    this.inputEl.removeEventListener(
                        "inputPromptSubmit", submitListener);
                    resolve(this.inputEl.value);
                }.bind(this);

                // Listen for inputPromptSubmit event
                this.inputEl.addEventListener(
                    "inputPromptSubmit", submitListener);
            });
        }
    }

    /**
     * A tooltip that shows under parentEl
     * 
     * Imitates Obsidian API obsidian.setTooltip(), with additional isError
     * option.
     * 
     * isError should be available somewhere in the API, where is it?
     */
    Tooltip = class {
        /**
         * Attaches a tooltip to a HTMLElement
         * @param {HTMLElement} parentEl - The element that the tooltip attaches to
         * @param {boolean} isError - If the tooltip notifies an error
         */
        constructor(parentEl, isError) {
            this.parentEl = parentEl;
            this.isError  = isError;

            this.el = createEl('div', { cls: "tooltip" });
            this.el.textNode = this.el.appendChild(new Text(""));
            this.el.createEl('div', { cls: "tooltip-arrow" });
        }

        show(message) {
            this.el.textNode.nodeValue = message;
            if (this.isError) { this.el.addClass("mod-error") }

            let parentRect = this.parentEl.getBoundingClientRect();
            this.el.setCssProps({
                "top":  `${parentRect.bottom + 8}px`,
                "left": `${parentRect.left + (parentRect.width/2)}px`,
            });

            this.mount();
        }

        hide() {
            this.unmount();
        }

        mount() {
            clearTimeout(this.timeoutID);
            this.timeoutID = setTimeout(() => { this.unmount() }, 2500);
            document.body.appendChild(this.el);
        }

        unmount() {
            this.el.parentElement?.removeChild(this.el);
        }
    }

    /**
     * Identical to Obsidian's Notice, but allows html element as message.
     */
    Notice = class extends Notice {
        constructor(messageEl, duration) {
            super("", duration);
            this.noticeEl.innerHTML = messageEl;
        }
    }

    PopoverSuggest = class extends obsidian.PopoverSuggest {
        constructor(
            app,
            scope,
            attachToEl,
            getSuggestions,
            renderSuggestion,
            suggestHandler,
        ) {
            super(app, scope);
            this.attachToEl = attachToEl;
            this.getSuggestions = getSuggestions;
            this.renderSuggestion = renderSuggestion;
            this.suggestHandler = suggestHandler;
        }

        open() {
            this.suggestions.setSuggestions(this.getSuggestions());
            this.suggestEl.style.left = `${this.attachToEl.getClientRects()[0].left}px`;
            this.suggestEl.style.top  = `${this.attachToEl.getClientRects()[0].bottom}px`;
            super.open();
        }

        toggle() {
            this.isOpen? this.close() : this.open();
        }

        selectSuggestion(value, evt) {
            this.suggestHandler(value);
            this.close();
        }
    }
}
