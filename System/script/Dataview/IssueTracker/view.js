/**
 * Dataview issue tracker
 * 
 * @author ljavuras <ljavuras.py@gmail.com>
 * ======================================== */

const { Obsidian, Templater } = await cJS();

/** Container HTMLElement of Issue Tracker */
const containerEl = dv.container;

/** User options passed through dv.view("path/to/IssueTracker", options) */
const user_options = input;

/** Expose Obsidian API */
const obsidian = input.obsidian || (await cJS()).obsidian;

/**
 * Options
 */
const default_options = {
    
    /** Fallback for project name, use project note, or folder name if not supplied */
    project_name: user_options?.project_note? user_options.project_note :
                                              getCurrentFolderName(),

    /** Fallback for project note, use project name, or folder name if not supplied */
    project_note: user_options?.project_name? user_options.project_name :
                                              getCurrentFolderName(),

    /** Sub-folder where issue notes should go */
    issue_folder: "issues/",

    /** Template name, a template that exists in templater folder, must include '.md' */
    issue_template: "note.project.issue",

    /** Default query that shows up in the search bar */
    default_query: "is:open",

    locale: "en-US",
};

const options = {
    ...default_options,
    ...(user_options || {}),
};

/**
 * Utilities
 */
function getCurrentFolderPath() {
    return dv.current().file.folder;
}

function getCurrentFolderName() {
    // Return the string after the last '/', if no '/' is found, return full path
    return getCurrentFolderPath()?.match(/\/([^\/]+)$/)?.[1]
        || getCurrentFolderPath();
}

function resolvePath(basepath, relative_path) {
    return obsidian.normalizePath(
        `${basepath}/${relative_path}`
    );
}

/** Returns a SVGElement */
const getIcon = {
    open: () => {
        let icon = obsidian.getIcon('circle-dot');
        icon.addClass("issue-open");
        return icon;
    },
    closed: () => {
        let icon = obsidian.getIcon('check-circle');
        icon.addClass("issue-closed");
        return icon;
    },
}

class IssueTracker {
    constructor(options) {
        this.config = {
            issueTracker: {
                default_query: options.default_query,

                /** A dataview link: [[path/to/issueTracker.md|Issues]] */
                link: dv.current().file.link.withDisplay("Issues"),
            },
            project: {
                name: options.project_name,

                /** A dataview link: [[path/to/ProjectNote.md|project_name]] */
                /** Fallbacks to options.project_name */
                link: Obsidian.vault.getFileByName(options.project_note)?
                    dv.page(Obsidian.vault.getFileByName(options.project_note)?.path
                        )?.file.link
                        .withDisplay(options.project_name) :
                    options.project_name,
            },
            issues: {
                folder_path:   resolvePath(getCurrentFolderPath(), options.issue_folder),
                template_name: options.issue_template,
            },
        };

        this.issueList = new this.IssueList(this);
        this.filter    = new this.Filter(this);
        this.searchBar = new this.SearchBar(this);

        this.el = createDiv({ cls: "issueTracker" });
        this.searchBar.render(this.el);
    }

    async render(containerEl) {
        containerEl.appendChild(this.el);
        await this.issueList.render(this.el);
    }

    Filter = class {
        constructor(issueTracker) {
            this.issueTracker = issueTracker;
            this.sortBy = "Newest";
        }

        async getStatusCount(status) {
            let query_without_status = structuredClone(this.query);
            delete query_without_status.status;

            return (await this.queryIssues(
                    this.issueTracker.issueList.issues,
                    query_without_status
                ))
                .filter((issue) => issue.status == status )
                .length;
        }

        submitQuery(query) {
            this.query = query;
            this.issueTracker.issueList.refresh();
        }

        /**
         * Filter issues with a query object
         * @param {Issue[]} issues 
         * @param {Object} query - Query object
         * @returns {Issue[]} Filtered issues
         */
        async queryIssues(issues, query) {
            async function includeIssue(issue, query) {
                if (query?.status) {
                    if (issue.status != query.status) { return false; }
                }
                for (let label of query.labels) {
                    if (!issue.labels
                        .some((issue_label) => issue_label.includes(label))) {
                        return false;
                    }
                }
                for (let title of query.title) {
                    if (!issue.name.toLowerCase().includes(title.toLowerCase())) {
                        return false;
                    }
                }
                for (let content of query.content) {
                    if (!issue.name.toLowerCase().includes(content.toLowerCase()) &&
                        !(await issue.getContent()).toLowerCase().includes(content.toLowerCase())) {
                        return false;
                    }
                }
                return true;
            }
            
            return (await Promise.all(
                issues.map(async (issue) => ({
                    issue: issue,
                    include: await includeIssue(issue, query)
                }))))
                .filter(data => data.include)
                .map(data => data.issue);
        }

        /**
         * Filter and sort issues with this.query
         * @param {Issue[]} issues 
         * @returns {Issue[]} Filtered and sorted issues
         */
        async filterIssues(issues) {
            return (await this.queryIssues(issues, this.query))
                .sort(issue => issue, "asc", (issue1, issue2) => {
                    switch (this.sortBy) {
                        case "Newest":
                            return issue2.created - issue1.created;
                        case "Oldest":
                            return issue1.created - issue2.created;
                        case "Recently updated":
                            return issue2.modified.ts - issue1.modified.ts;
                        case "Least recently updated":
                            return issue1.modified.ts - issue2.modified.ts;
                    }
                });
        }
    }

    SearchBar = class {
        constructor(issueTracker) {
            this.issueTracker = issueTracker;
            this.el           = createDiv({ cls: "issues__searchBar" });
            this.searchQuery  = new this.SearchQuery(issueTracker, this.el);
        }

        render(containerEl) {
            this.newIssueBtn = this.el.createEl("button", { text: "New Issue" });
            this.newIssueBtn.onclick = () => {
                new this.issueTracker
                    .CreateIssueModal(this.issueTracker)
                    .open();
            }
            this.newIssueBtn.updateState = () => {
                // Disable the button if issue folder doesn't exist
                if (Obsidian.vault.existsFolder(
                    this.issueTracker.config.issues.folder_path)) {
                    this.newIssueBtn.disabled = false;
                    this.newIssueBtn.removeClass("mod-disabled");
                } else {
                    this.newIssueBtn.disabled = true;
                    this.newIssueBtn.addClass("mod-disabled");
                }
            }
            this.newIssueBtn.updateState();

            containerEl.appendChild(this.el);
        }

        SearchQuery = class {
            constructor(issueTracker, containerEl) {
                this.issueTracker = issueTracker;
                this.containerEl = containerEl;

                this.input = createEl("input", {
                    attr: { placeholder: "Search issues" }
                });

                this.input.onkeydown = (event) => {
                    if (event.key == "Enter") {
                        this.setValue(this.input.value);
                    }
                }
                containerEl.appendChild(this.input);

                this.setValue(issueTracker.config.issueTracker.default_query);
            }

            _parse(query_string) {
                let status_query_exist = false;

                // Split queries by space, respect enclosed quotation marks
                this.query_tokens = query_string
                    .match(/((\S+)?"[^"]+")|[\S]+/g)
                    ?.map((token) => {
                        return new this.Token().fromString(token);
                    })
                    // Allow only one status query
                    .filter((token) => {
                        if (token.type == "status" || token.type == "is") {
                            if (status_query_exist) {
                                return false;
                            } else {
                                status_query_exist = true;
                                return true;
                            }
                        }
                        return true;
                    })
                    || [];
            }

            _render() {
                this.input.value = this.query_tokens
                    .reduce((query_string, token, index) => {
                        return query_string + (index? ' ' : '') + token.toString();
                    }, "")
            }

            _submit() {
                let query = {
                    status : undefined,
                    labels : [],
                    title  : [],
                    content: [],
                };

                for (const token of this.query_tokens) {
                    switch (token.type) {
                        case "status":
                        case "is":
                            query.status = token.content;
                            break;
                        case "label":
                            query.labels.push(token.content);
                            break;
                        case "title":
                            query.title.push(token.content);
                            break;
                        case "content":
                            query.content.push(token.content);
                    }
                }

                this._render();
                this.issueTracker.filter.submitQuery(query);
            }

            setValue(query_string) {
                this._parse(query_string);
                this._submit();
            }

            toggleStatus(status) {
                let status_token = this.query_tokens
                    .find(token => token.type.match(/^is|status$/));
                if (!status_token) {
                    this.query_tokens.push(new this.Token("is", status));
                } else if (status_token.content == status) {
                    this.query_tokens = this.query_tokens.filter((token) => {
                        return !token.type.match(/^is|status$/);
                    });
                } else {
                    status_token.content = status;
                }
                this._submit();
            }

            toggleQuery(type, content) {
                let query_token = this.query_tokens.find(token => 
                    token.type == type && token.content == content
                );
                if (query_token) {
                    this.query_tokens = this.query_tokens.filter((token) => {
                        return token.type != type || token.content != content
                    });
                } else {
                    this.query_tokens.push(
                        new this.Token(type, content)
                    );
                };
                this._submit();
            }

            Token = class {
                constructor(type, content) {
                    this._type = type;
                    this._content = content;
                }

                get type() { return this._type ?? "content"; }
                set type(string) { this._type = string; }
                get content() { return this._content.replaceAll('"', ''); }
                set content(string) {
                    this._content = string.indexOf(' ') != -1? `"${string}"` : string;
                }

                fromString(string) {
                    let { type, content } = string
                        .match(/^((?<type>status|is|title|label):)?(?<content>.+)$/)
                        .groups;

                    this._type = type;
                    this._content = content;
                    return this;
                }

                toString() {
                    return (this._type? `${this._type}:` : '')
                        + this._content;
                }
            }
        }
    }

    IssueList = class {
        constructor(issueTracker) {
            this.issueTracker = issueTracker;
            this.issueFolder  = issueTracker.config.issues.folder_path;
            this.issues       = dv.pages(`"${this.issueFolder}"`)
                                  .map(page => new this.Issue(issueTracker, page))
                                  .sort(issue => issue.issueNo, "desc");
            this.toolbar      = new this.ToolBar(issueTracker);

            this.el       = createDiv({ cls: "issueList" });
            this.issuesEl = createDiv();
        }

        async render(containerEl) {
            containerEl.appendChild(this.el);
            this.toolbar.render(this.el);
            this.el.appendChild(this.issuesEl);
        }

        async refresh() {
            this.toolbar.refresh();

            this.issuesEl.empty();
            if (this.issues.length == 0) {
                if (!Obsidian.vault.existsFolder(this.issueFolder)) {
                    this.noIssuesMessage.noFolder(this.issuesEl);
                } else {
                    this.noIssuesMessage.noIssues(this.issuesEl);
                }
            }
            for (const issue of await this.issueTracker.filter.filterIssues(this.issues)) {
                issue.render(this.issuesEl);
            }
            if (this.issuesEl.children.length == 0) {
                this.noIssuesMessage.noMatch(this.issuesEl);
            }
        }

        // Messages to display when no issues are available for display
        noIssuesMessage = {
            noFolder: (containerEl) => {
                let contentEl = containerEl.createDiv({ cls: "no-issues-message" });
                contentEl.appendChild(getIcon.open());
                contentEl.appendChild(createEl('h3', { text: "Getting started" }));
                
                let msgEl = contentEl.createDiv();
                let createFolderBtn = msgEl
                    .createEl('button', { text: "Create Folder" });
                msgEl.appendChild(new Text(" at "));
                msgEl.createEl('code', { text: this.issueFolder });
                msgEl.appendChild(new Text(
                    ", or specify your preferred subfolder for issue notes:"
                ));
                msgEl.createEl('pre').createEl('code', {
                    text: "dv.view(\"path/to/IssueTracker\", {\n"
                        + "    obsidian: obsidian,\n"
                        + "    issue_folder: \"your/subfolder/\",\n"
                        + "});"
                });

                // Create folder, enable "New Issue" button, refresh issueList
                createFolderBtn.onclick = async () => {
                    await Obsidian.vault.createFolder(this.issueFolder);
                    this.refresh();
                    this.issueTracker.searchBar.newIssueBtn.updateState();
                };
            },
            noIssues: (containerEl) => {
                let contentEl = containerEl.createDiv({ cls: "no-issues-message" });
                contentEl.appendChild(getIcon.closed());
                contentEl.appendChild(createEl('h3', { text: "A fresh start!" }));
                let msgEl = contentEl.createDiv();
                msgEl.appendChild(new Text("There are currently no issues."));
            },
            noMatch: (containerEl) => {
                let contentEl = containerEl.createDiv({ cls: "no-issues-message" });
                contentEl.appendChild(createEl('h3', { text: "No matches found" }));
            },
        }

        ToolBar = class {
            constructor(issueTracker) {
                this.issueTracker = issueTracker;
                this.statusOpenBtn
                    = new this.StatusBtn(this.issueTracker, "open", getIcon.open());
                this.statusClosedBtn
                    = new this.StatusBtn(this.issueTracker, "closed", getIcon.closed());
            }

            render(containerEl) {
                this.el = containerEl.createDiv({ cls: "issues__issueList__toolbar" });
                this.el.appendChild(this.statusOpenBtn.el);
                this.el.appendChild(this.statusClosedBtn.el);
            }

            refresh() {
                this.statusOpenBtn.refresh();
                this.statusClosedBtn.refresh();
            }

            StatusBtn = class {
                constructor(issueTracker, status, icon) {
                    this.issueTracker = issueTracker;
                    this.status = status;

                    // Capitalize first letter
                    let label = status.charAt(0).toUpperCase() + status.slice(1);

                    this.el = createSpan({ cls: "status-toggle" });
                    this.el.appendChild(icon);
                    this.el.appendChild(new Text(" "));
                    this.countText = this.el.appendChild(new Text(""));
                    this.el.appendChild(new Text(` ${label}`));
                    this.el.onclick = () => {
                        this.issueTracker.searchBar.searchQuery.toggleStatus(status);
                    }
                }

                async refresh() {
                    this.countText.nodeValue = await this.issueTracker.filter
                        .getStatusCount(this.status);
                }
            }
        }

        Issue = class {
            constructor(issueTracker, dataview_page) {
                this.issueTracker  = issueTracker;
                this.dv_file       = dataview_page.file;
                this.file          = Obsidian.vault
                                        .getFile(this.dv_file.path);
                this.issueNo       = dataview_page['issue/no'];
                this.status        = dataview_page['issue/status'];
                this.name          = dataview_page.file.name;
                this.labels        = dataview_page['issue/labels'] || [];
                this.created       = dataview_page.created;
                this.modified      = dataview_page.file.mtime;
                this._contentCache = '';
            }

            /**
             * Update issue content getter if issue template has changed.
             */
            async getContent() {
                if (this._contentCache) { return this._contentCache; }

                let issueMetadata = app.metadataCache.getFileCache(this.file);
                let sectionIndex = issueMetadata.sections.findIndex((section) => {
                    return section.type == "code";
                })
                if (issueMetadata.sections.length == sectionIndex + 1) {
                    return "";
                }
                let contentStartOffset = issueMetadata.sections[sectionIndex + 1]
                    .position.start.offset;

                this._contentCache = (await app.vault.cachedRead(this.file))
                    .slice(contentStartOffset);

                return this._contentCache;
            }

            render(containerEl) {
                this.el = containerEl.createDiv({ cls: "issue" });

                let issusStatusEl = this.el.createDiv({
                    cls: "issue-status",
                });
                issusStatusEl.appendChild(
                    this.status == "open"   ? getIcon.open() :
                    this.status == "closed" ? getIcon.closed() :
                    createDiv({ text: "?" })
                );

                let issueBodyEl = this.el.createDiv({ cls: "issue-body" });
                issueBodyEl.createEl("a", {
                    cls: "internal-link",
                    attr: { href: this.name, target: "_blank", rel: "noopener" },
                    text: this.name,
                });
                for (const label of this.labels) {
                    issueBodyEl.appendChild(new Text(" "));
                    let labelChipEl = issueBodyEl.createSpan({
                        cls: "label-chip",
                        attr: {label: label},
                        text: label,
                    })
                    labelChipEl.onclick = () => {
                        this.issueTracker.searchBar.searchQuery
                            .toggleQuery("label", label);
                    }
                }
                issueBodyEl.createDiv({
                    cls: "issue-desc",
                    text: `#${this.issueNo} opened on ${this.created
                        .setLocale(options.locale)
                        .toLocaleString(DataviewAPI.luxon.DateTime.DATETIME_SHORT)}`,
                })
            }
        }
    }

    CreateIssueModal = class extends obsidian.Modal {
        constructor(issueTracker) {
            super(app);
            this.issueTracker = issueTracker;

            this.containerEl.addClass("issueTracker__createIssue");
        }

        onOpen() {
            this.contentEl.createEl('h4', {
                text: `Issue: ${this.issueTracker.config.project.name}`
            });
            this.titleInput = this.contentEl.createEl('input', {
                cls: "title-setting",
                attr: { type: "text", placeholder: "Title" }
            });
            this.titleInput.tooltip = new Obsidian.Tooltip(this.titleInput, true);
            new obsidian.Setting(this.contentEl)
                .setClass("label-setting")
                .setName("Add labels")
                .addText((labelInput) => {
                    this.labelInput = labelInput.inputEl;
                    labelInput.inputEl.placeholder
                        = "Space delimitered labels, use \" \" to preserve space \"like this\"";
                })
            new obsidian.Setting(this.contentEl)
                .addButton((submitBtn) => {
                    submitBtn
                        .setButtonText("Create Issue")
                        .setCta()
                        .onClick(() => { this.submit() })
                })
        }

        onClose() {
            this.titleInput.tooltip.hide();
            this.contentEl.empty();
        }

        async submit() {
            let newIssueInfo = {
                issueNo: this.issueTracker.issueList.issues.length?
                    this.issueTracker.issueList.issues.issueNo.max() + 1 : 1,
                title:   this.titleInput.value,
                path:    `${this.issueTracker.config.issues.folder_path}/${this.titleInput.value}.md`,

                // Split labels by space, respects enclosed quotations marks
                labels:  this.labelInput.value?.match(/"[^"]+"|([^"\s]+)/g)
                             ?.map(label => label.replaceAll('"', '')),
                issueTrackerConfig: this.issueTracker.config,
            }

            // Handle invalid issue titles
            if (!newIssueInfo.title) {
                this.titleInput.tooltip.show(
                    "Issue title cannot be empty"
                );
                return;
            } else if (!Obsidian.vault
                    .isValidFilename(newIssueInfo.title)) {
                this.titleInput.tooltip.show(
                    "Issue title cannot contain any of the following characters:\n"
                    + Obsidian.vault.specialCharSet
                );
                return;
            } else if (this.issueTracker.issueList.issues.name
                .includes(newIssueInfo.title)) {
                this.titleInput.tooltip.show(
                    `Issue already exists`
                );
                return;
            }

            // Export new issue into to global for templater to pick up
            new IssueInfoExporter(newIssueInfo);

            // Create issue from template
            let issueFile = await Templater
                .createNewFileFromTemplate(
                    newIssueInfo.path,
                    this.issueTracker.config.issues.template_name
                )

            Obsidian.vault.openFile(issueFile, "new-tab");

            this.close();
        }
    }
}

/**
 * Export info of new issue onto global for templater to pickup
 */
class IssueInfoExporter {
    constructor(newIssueInfo) {
        this.issueNo            = newIssueInfo.issueNo;
        this.title              = newIssueInfo.title;
        this.labels             = newIssueInfo.labels || [];
        this.issueTrackerConfig = newIssueInfo.issueTrackerConfig;
        this.created            = dv.luxon.DateTime.now();

        // Mount itself to window
        if (window.newIssueInfo) { clearTimeout(window.newIssueInfo.timeoutID); }
        window.newIssueInfo = this;

        // Remove itself after templater probably has finished parsing
        this.timeoutID = setTimeout(() => {
            delete window.newIssueInfo;
        }, 2000);
    }

    /**
     * Both `issueTrackerLink()` and `projectNoteLink()` returns a Dataview Link
     * object, which offers various methods to mutate the link, see:
     * 
     * https://github.com/blacksmithgu/obsidian-dataview/blob/master/src/data-model/value.ts#L416
     */
    get issueTrackerLink() { return this.issueTrackerConfig.issueTracker.link; }
    get projectNoteLink()  { return this.issueTrackerConfig.project.link; }
}

await dv.view("System/script/Dataview/project/Navigation");
new IssueTracker(options).render(containerEl);
