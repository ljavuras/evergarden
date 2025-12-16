class Periodic extends customJS.Violet.Package {

    _path = "Periodic";

    get path() {
        return this._path;
    }

    commands = [
        {
            id: "open-daily",
            name: "Open daily note",
            callback: async () => {
                await this.open('daily')
            }
        },
        {
            id: "open-weekly",
            name: "Open weekly note",
            callback: async () => {
                await this.open('weekly')
            }
        },
        {
            id: "open-monthly",
            name: "Open monthly note",
            callback: async () => {
                await this.open('monthly')
            }
        },
        {
            id: "open-quarterly",
            name: "Open quarterly note",
            callback: async () => {
                await this.open('quarterly')
            }
        },
        {
            id: "open-yearly",
            name: "Open yearly note",
            callback: async () => {
                await this.open('yearly')
            }
        },
        {
            id: "open-next",
            name: "Navigate forward",
            callback: async () => {
                await this.open('next')
            }
        },
        {
            id: "open-previous",
            name: "Navigate backwards",
            callback: async () => {
                await this.open('previous')
            }
        },
    ]

    onload() {
        this.commands.forEach(cmd => this.addCommand(cmd));

        this.loadSettings();
        this.yearly    = new this.PeriodicType(this, "year");
        this.quarterly = new this.PeriodicType(this, "quarter");
        this.monthly   = new this.PeriodicType(this, "month");
        this.weekly    = new this.PeriodicType(this, "week");
        this.daily     = new this.PeriodicType(this, "day",
            function() {

                /**
                 * Renders project schedule for daily log
                 * @param {DataViewInlineAPI} dv - Contains Dataview API and the
                 * HTMLElement conatiner that Dataview renders to
                 * @deprecated since 2024/06/01.
                 * @todo remove `renderProjectSchedule` and `Projects.getSchedule`
                 * after updated daily notes before 2023/06/25
                 */
                this.renderProjectSchedule = function(dv) {
                        let period = dv.current().file.name;
                        dv.taskList(customJS.Projects.getSchedule(period));
                        dv.header(4, "Overdue");
                        dv.taskList(customJS.Projects.getSchedule(period, true));
                };
            }
        );

        this.periodicTypes = [
            this.yearly,
            this.quarterly,
            this.monthly,
            this.weekly,
            this.daily,
        ];
    }
    
    /**
     * Gets the periodic note type that matches the string
     * @param {string} string - A periodic note filename
     * @returns {object} Info about the periodic note type
     */
    getType(string) {
        for (const periodicType of this.periodicTypes) {

            // Test if string matches a periodic note filename format
            if (moment(string, periodicType.format, true).isValid()) {

                // Returns the matching periodic note type
                return periodicType;
            }
        }
    }

    get(string) {
        let periodic = new this.Periodic(string);
        return periodic.isValid()? periodic : false;
    }

    isPeriodic(string) {
        return !!this.getType(string);
    }

    /**
     * Opens a periodic note based on the target specified. A target can be:
     * - A periodic type:
     *   e.g., daily, weekly, monthly, quarterly, yearly, which opens the
     *   periodic type of current time.
     * - A navigation command:
     *   - next:     Open next periodic note of same periodic type
     *   - previous: Open previous periodic note of same periodic type
     *   - up:       Open periodic note above current periodic type
     *   - down:     Open periodic note below current periodic type
     * @param {string} target - Opens the target periodic note
     */
    async open(target) {
        const navCommands  = ['next', 'previous', 'up', 'down'];
        let   periodicType = this[target];

        // Opens periodic note for current time
        if (periodicType instanceof this.PeriodicType) {
            let path = `${periodicType.path}/${moment().format(periodicType.format)}.md`;
            await customJS.Obsidian.vault.openFile(path);

        // Navigate through periodic note
        } else if (navCommands.includes(target)) {
            let activeNote   = app.workspace.getActiveFile();
            let periodicType = this.getType(activeNote.basename);

            // Verify active note is periodic
            let activeNoteFolder = activeNote.path.match(/.+(?=\/)/)?.[0];

            if (!periodicType ||
                activeNoteFolder != periodicType.path) {
                // Active note is not periodic, abort
                throw new customJS.VaultError(
                    `Active note _${activeNote.path}_ is not a periodic note.`
                );
            }

            // Find target periodic note
            let targetMoment = moment(
                activeNote.basename,
                periodicType.format
            );
            switch (target) {
                case 'next':
                    targetMoment.add(1, periodicType.units);
                    break;
                case 'previous':
                    targetMoment.subtract(1, periodicType.units);
                    break;
                // TODO: up
                // TODO: down
                default:
                    return;
            }

            // Open target periodic note
            let path = `${periodicType.path}/${targetMoment.format(periodicType.format)}.md`;
            customJS.Obsidian.vault.openFile(path);
        }
    }

    /**
     * Rollover tasks from a previous perodic note
     * @param {string} period - Period of a note
     * @param {string} header - Roll over tasks under this header
     * @param {boolean} force - Roll over completed tasks if true
     * @returns {string} A string of markdown tasks
     */
    rolloverTask = async function(period, header, force = false) {
        // TODO: performance overhead
        //       pages are being queried and sorted each time, which is 
        //       expensive, and could be avoided
        // UNTESTED for weekly, monthly, quarterly and yearly notes

        return customJS.Dataview.api
            .pages(`"${this.getType(period).path}"`)  // Get all log of the same type
            .sort(page => page.file.name, 'desc')     // Sort by date
            .find(page => page.file.name < period)    // Previous log closest to period
            .file.tasks                               // Get task array
            .filter((task) => {
                // Get tasks under header
                return task.header.subpath == header;
            })
            .filter((task) => {
                // Get completed tasks if force == true
                return force || !task.completed;
            })
            .values.reduce((accumulator, currentValue, currentIndex) => {
                // Render markdown tasks
                return `${accumulator}${currentIndex? '\n' : ''}- [ ] ${currentValue.text}`;
            }, "");
    };

    PeriodicType = class {
        constructor(periodic, unit, format, init) {
            this.type     = (unit == "day")? "daily" : `${unit}ly`;
            this.unit     = unit;
            this.units    = `${unit}s`;
            this.format   = periodic.settings.format[this.type];
            this.path     = `${periodic.path}/${this.type}`;
            this.template = `note.periodic.${this.type}`;

            if (typeof init == "function") {
                init.call(this);
            };

            this.dataviewPages = function() {
                // TODO: Handle dataview absent error
                return customJS.Dataview.api
                    .pages(`"${this.path}"`);
            }
        }
    }

    /**
     * Represents a periodic note.
     */
    Periodic = class {
        /**
         * @param {string} period - Filename of a periodic note
         */
        constructor(period) {
            this.type = customJS.Periodic.getType(period);
            this._string = period;
        }

        /**
         * Does periodic_string matches a periodic note?
         * @returns {boolean}
         */
        isValid() {
            return !!this.type;
        }

        /**
         * Answers questions like: Is 2025-12-04 in 2025-W50?
         * @param {string} period - A string that represents a period of time
         * @returns {boolean}
         */
        includes(period) {
            if (!this.isValid) { return false; }

            return moment(period).isBetween(
                moment(this._string, this.type.format),
                moment(this._string, this.type.format).endOf(this.type.unit),
                undefined,
                '[]'
            );
        }

        /**
         * A Dataview page object of this periodic note
         * @returns {SMarkdownPage}
         */
        get page() {
            return this.isValid()?
                customJS.Dataview.api.page(
                    `${this.type.path}/${this._string}.md`
                ):
                false;
        }
    }
}
