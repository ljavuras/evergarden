class Area extends customJS.Violet.Package {
    areas = new Map();
    _updateQueue = [];

    constructor() {
        super();
        let { vault } = customJS.app;

        // Init areas
        if (datacore.core.initialized) {
            this.initGraph();
        } else {
            this.registerEvent(
                datacore.core.on("initialized", () => {
                    this.initGraph();
                })
            );
        }

        this.registerEvent(
            vault.on("modify", (file) => {
                const area = this.areas.get(file.path);
                if (!area) { return; }

                this._updateQueue.push(() => {
                    area.update();
                });
            })
        );

        // TODO: on delete
        // TODO: on rename

        this.registerEvent(
            datacore.core.on("update", () => {
                this._updateQueue.forEach(f => { f(); });
                this._updateQueue = [];
            })
        );
    }

    getByPath(path) {
        return this.areas.get(path);
    }

    initGraph() {
        for(const page of datacore.query("@page and #note/area")) {
            const area = new this.Area(this.areas, page)
            this.areas.set(area.path, area);
        }
        this.areas.forEach(area => area.linkSuper());

        // TODO: Detect loop
    }

    push(path) {
        const page = datacore.page(path);
        const area = new this.Area(this.areas, page);
        this.areas.set(path, area);
        area.linkSuper();
    }

    Area = class {
        constructor(areas, page) {
            this.areas = areas;
            this.page = page;
            this.subArea = [];
            this.superArea = [];
        }

        linkSuper() {
            let superLinks = this.page.$frontmatter["area/super"]?.value;
            superLinks = Array.isArray(superLinks)? superLinks : [superLinks];
            superLinks.forEach((superLink) => {
                const superArea = this.areas.get(superLink.path);
                if (superArea) {
                    this.superArea.push(superArea);
                    superArea.subArea.push(this);
                }
            });
        }

        unlinkSuper() {
            this.superArea.forEach(area => {
                const i = area.subArea.findIndex(area => area.path == this.path);
                area.subArea.splice(i, 1);
            });
            this.superArea = [];
        }

        update() {
            this.page = datacore.page(this.path);
            this.unlinkSuper();
            this.linkSuper();
        }

        get path() {
            return this.page.$path;
        }

        get name() {
            return this.page.$name.slice(2);
        }

        get subLinks() {
            const subAreas = new Map();

            function traverseDown(area) {
                area.subArea.forEach(subArea => {
                    subAreas.set(subArea.path, subArea);
                    traverseDown(subArea);
                })
            }

            traverseDown(this);
            return Array.from(subAreas, ([path, area]) => area.page.$link);
        }

        get superLinks() {
            const superAreas = new Map();

            function traverseUp(area) {
                area.superArea.forEach(superArea => {
                    superAreas.set(superArea.path, superArea);
                    traverseUp(superArea);
                })
            }

            traverseUp(this);
            return Array.from(superAreas, ([path, area]) => area.page.$link);
        }
    }
}