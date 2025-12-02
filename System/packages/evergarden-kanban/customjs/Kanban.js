/**
 * Kanban manipulation in Obsidian
 * 
 * Modify markdown files with format of obsidian-kanban plugin by mgmeyers:
 * https://github.com/mgmeyers/obsidian-kanban
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

class Kanban extends customJS.Violet.Package {
    app = customJS.app;
    _cache = new Map();

    // Get cache by path, update if tfile is more recent than cache
    get(tfile) {
        if (!(tfile instanceof obsidian.TFile)) { return; }
        if (!this._cache.has(tfile.path)
            || (this._cache.get(tfile.path).mtime < tfile.stat.mtime))
        {
            this._cache.set(tfile.path, new this.Kanban(tfile));
        }
        return this._cache.get(tfile.path);
    }

    clearCache() {
        this._cache.clear();
    }
    
    Kanban = class {
        constructor(tfile) {
            this.file = tfile;
            this.mtime = tfile.stat.mtime;
            
            /** @type {customJS.Kanban.Lane[]} */
            this.lanes = [];

            /** @type {customJS.Kanban.Card[]} */
            this.cards = [];

            /** @type {customJS.Kanban.Link[]} */
            this.links = [];

            // Remains as a promise until resolved, access with await
            this._cachedContent = (async () => {
                return await app.vault.cachedRead(this.file);
            })();

            let metadata = app.metadataCache.getFileCache(this.file);

            if (!metadata.frontmatter['kanban-plugin']) {
                throw new customJS.VaultError(`File "${this.file.path}" is not a kanban.`);
            }

            // Iterates until it finds next value that satisfies callbackFn
            // Only attach to iterators which has next() method
            function wrapIterator(iterator) {
                iterator.findNext = function(callbackFn) {
                    let next;
                    do {
                        next = this.next();
                        if (next.done) { break; }
                    } while (!callbackFn(next.value));
                    return next.value;
                }
                return iterator;
            }

            /**
             * Parse metadata into Lanes, Cards and Links
             * - metadata.headings: Every heading is a Lane title
             * - metadata.sections: Each ({type:heading}, {type:list}) pair
             *                      represents a Lane, list may be absent
             * - metadata.listItems: Any listItem started at column 0 is a card
             */

            /** Populate this.lanes */
            let sectionIterator = wrapIterator(metadata.sections[Symbol.iterator]());

            let nextSection;
            for (const heading of (metadata.headings || [])) {
                /**
                 * A lane consists of a heading, and a list section (if any)
                 * directly follows it.
                 * lane's position.end value is:
                 * - list section's position.end
                 * - or heading section's position.end, if it is an empty lane
                 */
                let lanePosition = heading.position;

                if (nextSection?.type != "heading" || !nextSection) {
                    sectionIterator.findNext(section => section?.type == "heading");
                }

                nextSection = sectionIterator.next().value;

                if (nextSection?.type == "list") {
                    lanePosition.end = nextSection.position.end;
                }

                this.lanes.push(new this.Lane(this, heading, lanePosition));
            }

            /** Returns true if outer contains inner */
            function isContain(outer, inner) {
                return inner.position.start.offset >= outer?.position.start.offset
                    && inner.position.end.offset <= outer?.position.end.offset;
            }
            
            /** Populate this.cards */
            let laneIterator = wrapIterator(this.lanes[Symbol.iterator]());
            let currentLane, currentCard;
            for (const listItem of (metadata.listItems || [])) {
                if (!isContain(currentLane, listItem)) {
                    currentLane = laneIterator.findNext(
                        lane => isContain(lane, listItem)
                    );
                }

                // Rest of the listItems don't belong in any lanes
                if (!currentLane) { break; }

                if (listItem.parent < 0) {
                    // Top level list/task represents a card
                    currentCard = new this.Card(this, currentLane, listItem.position);
                    this.cards.push(currentCard);
                    currentLane._addCard(currentCard);
                } else {
                    // Not top level, merge into current card
                    currentCard._setEnd(listItem.position.end);
                }
            }

            /** Populate this.links */
            let cardIterator = wrapIterator(this.cards[Symbol.iterator]());
            currentCard = undefined;
            for (const link of (metadata.links || [])) {
                if (!isContain(currentCard, link)) {
                    currentCard = cardIterator.findNext(
                        card => isContain(card, link)
                    )
                }

                // Rest of the links don't belong in any cards
                if (!currentCard) { break; }

                let currentLink = new this.Link(
                    this,
                    link.original,
                    link.position,
                    currentCard
                );
                this.links.push(currentLink);
                currentCard._addLink(currentLink);
            }
        }

        get project() {
            return customJS.Projects.getProjectByFile(this.file);
        }

        get link() {
            return new customJS.Obsidian.Link(this.file);
        }

        // Async getter
        get content() {
            return this._cachedContent;  // Returns a promise
        }

        getLaneByName(laneName) {
            return this.lanes.find(lane => lane.title == laneName);
        }

        getCardByFile(tfile) {
            let targetLink = new customJS.Obsidian.Link(tfile, this.file.path);

            return this.links.find((link) => {
                    return targetLink.equals(link.link);
                })
                ?.card;
        }

        insertLink(laneName, tfile) {
            this.insertCard(
                laneName,
                new customJS.Obsidian.Link(tfile, this.file.path).toString()
            );
        }

        insertCard(laneName, cardContent) {
            this._insertToHeading(
                laneName,
                `- [ ] ${cardContent.replaceAll('\n', '\n    ')}`
            );
        }
        
        _insertToHeading(heading, content) {
            customJS.Markdown.insertToHeading(this.file, heading, content, false);
        }

        Lane = class {
            constructor(kanban, heading, position) {
                this.kanban = kanban;
                this.heading = heading
                this.position = position;
                this.cards = [];
            }

            get title() {
                return this.heading.heading;
            }

            get project() {
                return this.kanban.project;
            }

            get length() {
                return this.cards.length;
            }

            _addCard(card) {
                this.cards.push(card);
            }
        }

        Card = class {
            constructor(kanban, lane, position) {
                this.kanban = kanban;
                this.lane = lane;
                this.position = position;
                this.links = [];
                this._fixEndings();
            }

            _setEnd(end) {
                this.position.end = end;
                this._fixEndings();
            }

            _addLink(link) {
                this.links.push(link);
            }

            // Check for carriage return. Obsidian only includes one character
            // for line endings, causes bugs for CRLF (/r/n) endings
            _fixEndings() {
                this.kanban.content.then((content) => {
                    if (content[this.offsetEnd] === "\r") {
                        this.position.end.offset++;
                        this.position.end.col++;
                    }
                })
            }

            remove() {
                app.vault.process(this.kanban.file, (data) => {
                    // + 1 to remove new line
                    return data.slice(0, this.offsetStart)
                        + data.slice(this.offsetEnd + 1);
                });
            }

            get offsetStart() {
                return this.position.start.offset;
            }

            get offsetEnd() {
                return this.position.end.offset;
            }

            // Async getter
            get content() {
                return this.kanban.content.then((kanban_content) => {
                    return kanban_content.slice(
                        this.offsetStart + 6,
                        this.offsetEnd
                    ).replaceAll('\n    ', '\n');
                });
            }

            async moveToLane(laneName) {
                if (laneName === this.lane.title) { return; }
                let targetLane = this.kanban.getLaneByName(laneName);
                if (targetLane.position.start.line >
                    this.lane.position.start.line
                ) {
                    this.kanban.insertCard(targetLane.title, await this.content);
                    this.remove();
                } else {
                    this.remove();
                    this.kanban.insertCard(targetLane.title, await this.content);
                }
            }
        }

        Link = class {
            constructor(kanban, linkString, position, card) {
                this.kanban = kanban;
                this.link = new customJS.Obsidian.Link()
                    .fromString(linkString, kanban.file.path);
                this.position = position;
                this.card = card;
            }

            get lane() {
                return this.card.lane;
            }
        }
    }
}