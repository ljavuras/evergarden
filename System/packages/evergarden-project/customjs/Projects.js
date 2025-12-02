class Projects extends customJS.Violet.Package {
    onload() {
        this.commands.forEach(cmd => this.addCommand(cmd));
    }

    // All project folder stays under this path
    _path = "Project";

    get path() {
        return this._path;
    }

    /**
     * Get all projects with specific state, e.g., archived, backlog.
     * Returns all projects of no state is specified.
     * @param {String} projectState
     * @returns {Projects.Project[]}
     */
    getProjects(projectState) {
        let projects = customJS.Dataview.api.pages("#a/project")
            .array()
            .map(page => new this.Project(
                customJS.Dataview.getFile(page)
            ));
        
        if (projectState) {
            projects = projects.filter(project => project.state == projectState);
        }
        return projects;
    }

    /**
     * Checks if a file is a project file
     * @param {TFile} file
     * @returns {Boolean} True if file is a project main file
     */
    isProject(file) {
        return customJS.Obsidian.file.getTags(file)
            ?.find(tag => tag.match(/^#a\/project(\/|$)/));
    }

    /**
     * Checks if a project exists
     * @param {String} projectName - Name of a project
     * @returns {Boolean} Returns true if a project exists
     */
    exists(projectName) {
        const path = `${this._path}/${projectName}/${projectName}.md`;
        if (customJS.Obsidian.vault.existsFile(path)) {
            let file = customJS.Obsidian.vault.getFile(path);
            return file && this.isProject(file);
        }
        return false;
    }

    /**
     * Creates a new project
     * @param {string} projectName - Name of the new project
     */
    async create(projectName) {
        await customJS.Obsidian.vault.createFolder(
            `${this._path}/${projectName}`
        );

        const projectNote = await customJS.Templater
            .createNewFileFromTemplate(
                `${this._path}/${projectName}/${projectName}.md`,
                "note.project.main"
            );

        return new this.Project(projectNote);
    }

    /**
     * Get the project a file belongs to
     * @param {TFile} [file] - Defaults to active file if not supplied
     * @returns {Projects.Project}
     */
    getProjectByFile(file = customJS.Obsidian.workspace.getActiveFile()) {
        return this.getProjectByPath(file.path);
    }

    /**
     * Get the project a path belongs to
     * @param {String} path - Path within the vault
     * @returns {Projects.Project}
     */
    getProjectByPath(path) {
        let name = path.match(new RegExp(
            `^${this._path}\/(?<name>[^\/]+)`
        ))?.groups.name;

        if (!name) { return; }
        let file = customJS.Obsidian.vault.getFile(
            `${this._path}/${name}/${name}.md`
        );
        
        if (!file) { return; }
        if (this.isProject(file)) {
            return new this.Project(file);
        }
    }

    getProjectByName(name) {
        let file = customJS.Obsidian.vault.getFile(
            `${this._path}/${name}/${name}.md`
        );

        if (!file) { return; }
        if (this.isProject(file)) {
            return new this.Project(file);
        }
    }

    /** 
     * Get schedule of a time period from all projects
     * @param {string} period - The time period to get schedule from
     * @param {boolean} [getOverdue] - Get overdue tasks if true
     * @returns {STask[]} Array of dataview tasks
     */
    getSchedule(period, getOverdue = false) {
        let tasks = this.getProjects('active')
            .map((project) => {
                return getOverdue ? project.getOverdueSchedule(period)
                                  : project.getSchedule(period);
            })
            .flatMap(x => x);

        return tasks;
    }

    commands = [
        {
            /** Prompts user for input and creates a new project.
             */
            id: "create",
            name: "Create new project",
            callback: async () => {
    
                const { Obsidian, VaultError, Templater } = await cJS();
    
                // Opens an input prompt to take user input
                let inputPrompt = new Obsidian.InputPromptModal(
                    "create project",
                    "Project name",
                );
    
                // Read project name from user input
                let projectName = (await inputPrompt.getInput())?.trim();
    
                // Catch empty project name
                if (!projectName) {
                    throw new VaultError("Project name cannot be empty.");
                }
    
                // Catch invalid filename
                if (!Obsidian.vault.isValidFilename(projectName)) {
                    throw new VaultError(
                        "Project name connot contain any of the following characters:\n" +
                        Obsidian.vault.specialCharSet
                    );
                }
    
                // Catch existing project name
                if (this.exists(projectName)) {
                    throw new VaultError(`Project ${projectName} already exists.`);
                }
    
                // Create project
                let project = await this.create(projectName);
    
                // Open project page
                await Obsidian.vault.openFile(project.file, 'new-tab');
                await Templater.plugin.editor_handler
                    .jump_to_next_cursor_location(project.file, true);
            }
        },
    ]

    Project = class {

        /**
         * Project class constructor
         * @param {TFile} file - Project main file
         */
        constructor(file) {
            this.file = file;
            this.name = file.basename;
            this.path = file.parent.path;
            this.state = customJS.Obsidian.frontmatter.get(file)
                ?.['project/state'];

            // Main page of the project
            // Dataview SMarkdownPage
            this.mainPage = DataviewAPI.page(file.path);

            /**
             * Schedule are markdown tasks in main file under "Schedule" heading
             * with due field.
             */
            this.schedule = this.mainPage.file.tasks
                .filter((task) => {

                    // Select tasks under "Schedule" header &
                    // Keep tasks that has a due value
                    return task.header.subpath = "Schedule" &&
                           customJS.Dataview.hasField(task.text, "due");
                })
                .map((task) => {

                    // Clone to future-proof as task.children is depricated
                    task.subtasks = task.children;

                    // Initialize due field
                    let dueText = customJS.Dataview.getField(
                        task.text,
                        "due"
                    );

                    let dueType = customJS.Periodic.getType(dueText);
                    task.due = {
                        text: dueText,
                        type: dueType.type,
                        unit: dueType.unit,
                        format: dueType.format,
                        moment: moment(dueText, dueType.format),
                    };

                    return task;
                });
        }

        get notePath() {
            return `${this.mainPage.file.folder}/notes`;
        }

        get link() {
            return new customJS.Obsidian.Link(this.file);
        }

        get issueTracker() {
            return customJS.Obsidian.frontmatter
                .getLink(this.file, "project/issue-tracker")
                ?.file;
        }

        get kanban() {
            return customJS.Obsidian.frontmatter
                .getLink(this.file, "project/kanban")
                ?.file;
        }

        async createIssueTracker(name) {
            const issueTracker = await customJS.Templater
                .createNewFileFromTemplate(
                    name?
                        `${this.path}/${name}.md`:
                        `${this.path}/Issues - ${this.name}.md`,
                    "note.project.issue-tracker"
                );

            const issueTrackerLink = new customJS.Obsidian.Link(
                issueTracker, this.file.path
            );

            customJS.Obsidian.frontmatter.set(
                this.file,
                { 'project/issue-tracker': issueTrackerLink.toString() }
            );

            return issueTracker;
        }

        async createKanban(name) {
            const kanban = await customJS.Templater
                .createNewFileFromTemplate(
                    name?
                        `${this.path}/${name}.md`:
                        `${this.path}/Kanban - ${this.name}.md`,
                    "note.project.kanban"
                );

            const kanbanLink = new customJS.Obsidian.Link(
                kanban, this.file.path
            );

            customJS.Obsidian.frontmatter.set(
                this.file,
                { 'project/kanban': kanbanLink.toString() }
            );

            return kanban;
        }
        
        /** 
         * Get schedule of a time period of a project
         * @param {string} period - The time period to get schedule from
         * @returns {STask[]} Array of dataview tasks
         */
        getSchedule(period) {
            let dueRegexes = [];
            let tasks = [];

            // Populate dueRegexes
            switch (customJS.Periodic.getType(period).type) {
                case "yearly":
                    /**
                     * Yearly schedule fallback
                     * year
                     */
                    dueRegexes = [
                        new RegExp('^' + period + '$'),
                    ]
                    break;

                case "quarterly":
                    let timeMoment = moment(period, customJS.Periodic.quarterly.format);

                    let year    = timeMoment.year();
                    let quarter = timeMoment.quarter();

                    // MM formated months in this quarter period
                    let months  = [1, 2, 3]
                        .map(m => m + (quarter - 1)*3)
                        .map(m => m.toString().padStart(2, "0"));

                    /**
                     * Quarterly schedule fallback
                     * quarter > month > year
                     */
                    dueRegexes = [
                        new RegExp('^' + period + '$'),
                        new RegExp(String.raw`^${year}-(${months.join("|")})$`),
                        new RegExp('^'+ year + '$')
                    ];
                    break;

                case "monthly":
                    /**
                     * Monthly schedule fallback
                     * month
                     */
                    dueRegexes = [
                        new RegExp('^' + period + '$'),
                    ]
                    break;

                case "weekly":
                    let genWeeklyRegex = function (period, format) {
                        let weekStartMoment = moment(period);
                        let weekEndMoment   = weekStartMoment.clone().endOf('week');

                        return new RegExp('^' +
                            weekStartMoment.format(format) + '|' +
                            weekEndMoment.format(format) + '$'
                        );
                    }

                    /**
                     * Weekly schedule fallback
                     * week > month > quarter > year
                     */
                    dueRegexes = [
                        new RegExp('^' + period + '$'),
                        genWeeklyRegex(period, customJS.Periodic.monthly.format),
                        genWeeklyRegex(period, customJS.Periodic.quarterly.format),
                        genWeeklyRegex(period, customJS.Periodic.yearly.format)
                    ];
                    break;

                case "daily":
                    let dayMoment = moment(period);

                    /**
                     * Daily schedule fallback
                     * day > week > month > quarter > year
                     */
                    dueRegexes = [
                        new RegExp('^' + period + '$'),
                        new RegExp('^' + dayMoment.format(customJS.Periodic.weekly.format) + '$'),
                        new RegExp('^' + dayMoment.format(customJS.Periodic.monthly.format) + '$'),
                        new RegExp('^' + dayMoment.format(customJS.Periodic.quarterly.format) + '$'),
                        new RegExp('^' + dayMoment.format(customJS.Periodic.yearly.format) + '$'),
                    ];
                    break;
            }

            // Filter tasks by dueRegexes
            dueRegexes.some((dueRegex, index) => {

                // Filter tasks with dueRegex
                tasks = this.schedule.filter(function isDue(task) {
                    // Recursive filter children
                    task.children = task.subtasks.filter(isDue);
                    // Keep incomplete tasks that matches dueRegex
                    return dueRegex.test(task.due.text) &&
                            !task.completed;
                });

                // Tasks found, post processing
                if (tasks.length) {

                    // Don't render due, if due date is identical to period
                    if (index == 0) {
                        tasks.map((task) => {
                            task.visual = customJS.Dataview.stripField(
                                task.text,
                                "due"
                            );
                            return task;
                        })
                    } else {
                        // Display task.text directly
                        tasks.forEach((task) => {task.visual = undefined});
                    }
                    // End dueRegex fallback
                    return true;
                }
                // Try next regex if no tasks matched
                return false;
            })

            return tasks;
        }

        /**
         * Gets overdued schedules of a time period of a project
         * @param {string} period - The time period of the schedule
         * @returns {STaks[]} Array of dataview tasks
         */
        getOverdueSchedule(period) {
            let periodType = customJS.Periodic.getType(period);
            let periodEnd = moment(period, periodType.format).endOf(periodType.unit);

            let tasks = this.schedule.filter(function isOverDue(task) {
                // Recursive filter children
                task.children = task.subtasks.filter(isOverDue);

                return !task.completed &&
                       periodEnd.isAfter(task.due.moment.clone().endOf(task.due.unit));
            });

            return tasks;
        }
    }
}
