/**
 * Automatically embed Datacore code blocks into notes
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

class AutoEmbed extends customJS.Violet.Package {

    // Regsitered embeds
    _embeds = [];

    ORDER = Object.freeze({
        TITLE_BAR: -40,
        VIEWPORT_TOP: -30,
        INLINE_TITLE: -20,
        PROPERTIES: -10,
        DOCUMENT: 0,
        FOOTNOTES: 10,
        BACKLINKS: 20,
        VIEWPORT_BOTTOM: 30,
    });

    /**
     * Register an embed to be rendered.
     * @param {object} embedSpec - Positions and renders the embed
     * @param {string} embedSpec.id
     * @param {number} embedSpec.order
     * @param {(view: MarkdownView) => boolean} embedSpec.shouldEmbed
     * @param {(containerEl: HTMLElement, view: MarkdownView) => null} embedSpec.renderEmbed
     * @param {(renderer: MarkdownPreviewRenderer) => {anchorEl: HTMLElement, order: number}} [embedSpec.locatePreviewAnchor]
     * @param {(tree: import('@lezer/common').Tree, editorState: import('@codemirror/state').EditorState) => {pos: number, side: number}} [embedSpec.locateSourcePosition]
     */
    registerEmbed(embedSpec) {
        if (!this._embeds.pushSorted) {
            // Source - https://stackoverflow.com/a/56588334
            // Posted by Pablote
            // Retrieved 2025-12-22, License - CC BY-SA 4.0
            Array.prototype.pushSorted = function(el, compareFn) {
                let index = (function(arr) {
                    var m = 0;
                    var n = arr.length - 1;
                    while (m <= n) {
                        var k = (n + m) >> 1;
                        var cmp = compareFn(el, arr[k]);
                        if (cmp > 0) m = k + 1;
                        else if (cmp < 0) n = k - 1;
                        else return k;
                    }
                    return -m - 1;
                })(this);
                if (index >= 0)
                    this.splice(index, 0, el);
                else if (index < 0)
                    this.splice((index * -1) - 1, 0, el);
                return this.length;
            };
        }

        // Reject invalid embedSpec
        if (!embedSpec.id
            || !(typeof embedSpec.order === "number" && isFinite(embedSpec.order))
            || !(embedSpec.shouldEmbed instanceof Function)
            || !(embedSpec.renderEmbed instanceof Function)
        ) {
            return;
        }

        // Embeds within document have to provide locatePreviewAnchor and
        // locateSourcePosition
        if (embedSpec.order === 0) {
            if (!(embedSpec.locatePreviewAnchor instanceof Function)
                || !(embedSpec.locateSourcePosition instanceof Function)
            ) {
                return;
            }
        }

        // Reject registered embedSpec
        if (this._embeds.some((embed) => embed.id == embedSpec.id)) {
            return;
        }

        const shouldEmbed = embedSpec.shouldEmbed;
        embedSpec.shouldEmbed = function() {
            try {
                return shouldEmbed.apply(this, arguments);
            } catch (e) {
                console.error(e);
                return false;
            }
        }

        this._embeds.pushSorted(
            embedSpec,
            (a, b) => a.order - b.order
        );

        this.rerender();
    }

    /**
     * Unregister an embed.
     * @param {string} embedId - Embed identifier
     */
    unregisterEmbed(embedId) {
        const index = this._embeds.findIndex((embedSpec) => embedSpec.id === embedId);
        if (index > -1) {
            this._embeds = this._embeds.slice(index, 1);
            this.rerender();
        }
    }

    constructor() {
        super();

        // `require()` provided by plugin CodeScript Toolkit
        const { StateEffect } = require("@codemirror/state");

        // Dispatch this effect when this._embed updates
        this.autoEmbedUpdateEffect = StateEffect.define();
    }

    async onload() {
        /**
         * Embeds outside viewport
         * - Before title bar
         * - After title bar
         * - Bottom bar
         */
        // Embed newly opened MarkdownView
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', (leaf) => {
                this.embedMarkdownView(leaf.view);
            })
        );
        // Embed currently opened MarkdownView
        this.app.workspace.getLeavesOfType('markdown').forEach((leaf) => {
            this.embedMarkdownView(leaf.view);
        });

        const { around } = await requireAsync("monkey-around");  // Use async for mobile support

        /**
         * Embeds within reading mode header / footer
         */
        let updateHeaderFooterEmbeds = this.updateHeaderFooterEmbeds;
        let unwrapMarkdownPreviewView = around(
            obsidian.MarkdownPreviewView.prototype,
            {
                show(originalShow) {
                    return function() {
                        originalShow.apply(this, arguments);
                        updateHeaderFooterEmbeds.call(this);
                    }
                }
            }
        );

        /**
         * Embeds within reading mode viewport
         */
        let updatePreviewViewportEmbeds = this.updatePreviewViewportEmbeds;
        let unwrapMarkdownPreviewRenderer = around(
            obsidian.MarkdownPreviewRenderer.prototype,
            {
                updateVirtualDisplay(originalUpdateVirtualDisplay) {
                    return function() {
                        originalUpdateVirtualDisplay.apply(this, arguments);
                        updatePreviewViewportEmbeds.call(this);
                    }
                }
            }
        );

        /**
         * Embeds within edit mode header / footer
         */
        let unwrapMarkdownSourceView = this.wrapMarkdownSourceView(around);
        if (!unwrapMarkdownSourceView) {
            const eventRef = this.app.workspace.on('active-leaf-chnage', (leaf) => {
                unwrapMarkdownSourceView = this.wrapMarkdownSourceView(around);
                if (unwrapMarkdownSourceView) {
                    this.app.workspace.offref(eventRef);
                }
            });
            this.registerEvent(eventRef);
        }

        /**
         * Embeds within edit mode editor
         */
        this.registerEmbedCMExtension();

        /**
         * Rerender embed on file rename
         */
        this.registerEvent(this.app.vault.on('rename', (file) => {
            this.app.workspace.getLeavesOfType('markdown').forEach((leaf) => {
                if (leaf.view.file === file) {
                    this.rerenderView(leaf.view);
                }
            });
        }));
        
        // Rerender for embeds to take effect
        this.rerender();

        this.register(() => {
            unwrapMarkdownPreviewRenderer();
            unwrapMarkdownPreviewView();
            unwrapMarkdownSourceView && unwrapMarkdownSourceView();
        })
    }

    onunload () {
        this.app.workspace.getLeavesOfType('markdown').forEach((leaf) => {
            // Clean up embed recyclers
            delete leaf.view.embedRecycler;
            delete leaf.view.previewMode?.renderer?.embedRecycler;
            // Clean up embeds
            this.unembedMarkdownView(leaf.view);
            if (leaf.view.currentMode)
                this.unembedHeaderFooter.call(leaf.view.currentMode);
            // Rerender to clear embeds in viewport
            leaf.view?.previewMode?.rerender();
            leaf.view?.editMode?.editor.cm.dispatch({
                effects: this.autoEmbedUpdateEffect.of()
            });
        });

    }

    /**
     * Register CodeMirror extension to embed within editor
     */
    registerEmbedCMExtension() {
        // `require()` provided by plugin CodeScript Toolkit
        const { Decoration, WidgetType, EditorView } = require("@codemirror/view");
        const { StateField, RangeSetBuilder } = require("@codemirror/state");
        const { syntaxTree } = require("@codemirror/language");

        class AutoEmbedWidget extends WidgetType {
            constructor(embedSpec, markdownView) {
                super();
                this.embedSpec = embedSpec;
                this.markdownView = markdownView;
            }

            get id() { return this.embedSpec.id; }
            get order() { return this.embedSpec.order; }
            get shouldEmbed() { return this.embedSpec.shouldEmbed; }
            get renderEmbed() { return this.embedSpec.renderEmbed; }

            eq(other) { return this.id === other.id; }

            toDOM() {
                const embedRecycler = this.markdownView.embedRecycler;
                if (embedRecycler.has(this.embedSpec)) {
                    return embedRecycler.get(this.embedSpec);
                }
                let el = createDiv({
                    cls: "cm-embed-block markdown-rendered evergarden auto-embed",
                    attr: {
                        "data-embed-id": this.id,
                        "data-embed-order": this.order
                    },
                });
                this.renderEmbed(
                    el,
                    this.markdownView
                );
                embedRecycler.push(this.embedSpec, el);
                return el;
            }
        }

        const buildAutoEmbedDecorationSet = (editorState) => {
            const markdownView = editorState.field(obsidian.editorViewField);
            
            // Only show embed in Live Preview mode, skip if in Source mode
            if (markdownView.editMode.sourceMode) {
                return Decoration.none;
            }

            let builder = new RangeSetBuilder();
            const ORDER = this.ORDER;

            // Initialze recycler
            if (!markdownView.embedRecycler){
                markdownView.embedRecycler = new this.EmbedRecycler();
            }

            const tree = syntaxTree(editorState);
            let frontmatterPos = 0;
            let footnoteStart = editorState.doc.length;
            let footnoteEnd = editorState.doc.length;

            let node = tree.topNode.firstChild;
            if (!node) return Decoration.none;
            while (node.name?.includes("frontmatter")) {
                frontmatterPos = node.to;
                node = node.nextSibling;
            }
            node = tree.topNode.lastChild;
            while (node.name?.includes("footnote")) {
                footnoteStart = node.from;
                node = node.prevSibling;
            }
            let pos, side;  // Embed widget position

            this._embeds.forEach((embedSpec) => {
                // Not within document
                if (embedSpec.order < ORDER.PROPERTIES
                    || embedSpec.order >= ORDER.BACKLINKS
                ) {
                    return;
                }
                // Should not embed
                if (!embedSpec.shouldEmbed(markdownView)) return;

                // After properties, before document
                if (embedSpec.order < ORDER.DOCUMENT) {
                    pos = frontmatterPos;
                    if (frontmatterPos === 0) {
                        // No frontmatter, place before first line
                        side = embedSpec.order;
                    } else {
                        // After frontmatter, side is positive
                        side = embedSpec.order - ORDER.PROPERTIES;
                    }
                }

                // Within document
                else if (embedSpec.order === ORDER.DOCUMENT) {
                    let position = embedSpec.locateSourcePosition(tree, editorState);
                    if (!position) return;
                    pos = position.pos;
                    side = position.side;
                }
                
                // After document, before footnotes
                else if (embedSpec.order < ORDER.FOOTNOTES) {
                    pos = footnoteStart;
                    side = embedSpec.order - ORDER.FOOTNOTES;
                }

                // After footnotes, before backlinks
                else {
                    pos = footnoteEnd;
                    side = embedSpec.order;
                }

                builder.add(
                    pos,
                    pos,
                    Decoration.widget({
                        widget: new AutoEmbedWidget(embedSpec, markdownView),
                        side: side,
                        block: true
                    }),
                );
            });
            return builder.finish();
        }

        const autoEmbedField = StateField.define({
            create(state) {
                return buildAutoEmbedDecorationSet(state);
            },
            update: (embeds, tr) => {
                if (tr.docChanged
                    || tr.effects.some(e => e.is(this.autoEmbedUpdateEffect))
                ) {
                    return buildAutoEmbedDecorationSet(tr.state);
                }
                return embeds.map(tr.changes);
            },
            provide: field => EditorView.decorations.from(field)
        });

        this.registerEditorExtension(autoEmbedField);
    }

    /**
     * Insert embeds into locations that aren't dynamically loaded by viewport
     * @param {MarkdownView} view - The target markdown view to embed.
     * @returns {null}
     */
    embedMarkdownView(view) {
        if (this.isInBackground(view)) return;
        this._embeds.forEach((embedSpec) => {
            // Within viewport, handled by updatePreviewViewportEmbeds &
            // updateHeaderFooterEmbeds
            if (embedSpec.order >= this.ORDER.VIEWPORT_TOP
                && embedSpec.order < this.ORDER.VIEWPORT_BOTTOM)
                return;

            // Already embedded
            if (view.containerEl
                .querySelector(`:scope > [data-embed-id="${embedSpec.id}"]`)
            ) {
                return;
            }

            // Should not embed
            if (!embedSpec.shouldEmbed(view)) return;

            const el = createDiv({
                cls: "view-embed evergarden auto-embed",
                attr: {
                    "data-embed-id": embedSpec.id,
                    "data-embed-order": embedSpec.order,
                },
            });
            embedSpec.renderEmbed(el, view);

            // Before title bar
            if (embedSpec.order < this.ORDER.TITLE_BAR) {
                view.headerEl.before(el);
            }

            // After title bar
            else if (embedSpec.order < this.ORDER.VIEWPORT_TOP) {
                view.contentEl.before(el);
            }

            // Bottom bar
            else {
                view.containerEl.appendChild(el);
            }
        })
    }

    unembedMarkdownView(view) {
        view.containerEl
            .querySelectorAll(":scope > .evergarden.auto-embed")
            .forEach(element => element.remove());
    }

    /**
     * Redraws embeds in viewport of preview mode
     * Called after MarkdownPreviewRenderer.updateVirtaulDisplay
     * @returns {null}
     */
    updatePreviewViewportEmbeds = function() {
        // this: MarkdownPreviewRenderer = MarkdownView.previewMode.renderer

        // When opend in Live Preview/Source mode, sections aren't rendered yet
        if (!this.sections.length) return;

        // When switched tabs, hidden viewport only keeps pusher and header
        if (this.sizerEl.children.length < 3) return;

        if (!customJS.AutoEmbed) return;
        const ORDER = customJS.AutoEmbed.ORDER;

        const view = this.owner.view  // MarkdownPreviewView
            ?? this.owner.owner;      // MarkdownEmbedView

        // No embeds are visible within preview viewport
        if (!customJS.AutoEmbed._embeds.some(embedSpec => (
            embedSpec.order >= ORDER.PROPERTIES
            && embedSpec.order < ORDER.BACKLINKS
            && embedSpec.shouldEmbed(view)
        ))) {
            return;
        }

        // Initialze recycler
        if (!this.embedRecycler){
            this.embedRecycler = new customJS.AutoEmbed.EmbedRecycler();
        }

        const metadata = app.metadataCache.getCache(this.owner.path);
        const firstEl = this.sizerEl.firstElementChild.nextElementSibling;  // Ignore .markdown-preview-pusher
        const lastEl = this.sizerEl.lastElementChild;

        let isTopInView = false;
        let isBottomInView = false;

        // Check if top of document is in view
            if (firstEl.hasClass("mod-header")
                || firstEl.hasClass("mod-frontmatter")
            ) {
                isTopInView = true
            } else {
                const firstLine = metadata.sections
                    ?.find(section => section.type !== 'yaml')
                    .position.start.line;
                const line = this.sections
                    .find(section => section.el === firstEl)
                    ?.start.line;
                isTopInView = (line === firstLine);
        }

        // Check if bottom of document is in view
            if (lastEl.hasClass("mod-footer")
                || (lastEl.hasClass("el-section") && lastEl.querySelector(":scope > .footnotes"))
            ) {
                isBottomInView = true;
            } else {
                const lastLine = metadata.sections
                    ?.at(-1).position.end.line;
                const line = this.sections
                    .find(section => section.el === lastEl)
                    ?.end.line;
                isBottomInView = (line === lastLine);
        }

        // Initialize for embed location search
        let anchorEl,
            hasBeforeDocument = false,
            hasBeforeFootnotes = false,
            hasBeforeBacklinks = false;

        /**
         * Iterate embed specs
         */
        customJS.AutoEmbed._embeds.forEach((embedSpec) => {
            // Embed isn't in viewport, or in header/footer
            if (embedSpec.order < ORDER.PROPERTIES) return;
            if (embedSpec.order >= ORDER.BACKLINKS) return;

            // Shouldn't embed
            if (!embedSpec.shouldEmbed(view)) return;

            // Embedded element
            let el = this.embedRecycler.get(embedSpec);
            if (!el) {
                el = createDiv({
                    cls: "el-pre mod-ui markdown-rendered evergarden auto-embed",
                    attr: {
                        "data-embed-id": embedSpec.id,
                        "data-embed-order": embedSpec.order,
                    },
                });
                embedSpec.renderEmbed(el, view);
                this.embedRecycler.push(embedSpec, el);
            }

            /**
             * Find embed location
             */
            // After properties, before document
            if (embedSpec.order < ORDER.DOCUMENT) {
                if (!isTopInView) return;

                // First embed of this category
                if (!hasBeforeDocument) {
                    hasBeforeDocument = true;
                    anchorEl = firstEl;
                    while (anchorEl.hasClass("mod-header")
                        || anchorEl.hasClass("mod-frontmatter")
                    ) {
                        anchorEl = anchorEl.nextElementSibling;
                    }
                }
                anchorEl.before(el);
            }

            // Within document
            else if (embedSpec.order === ORDER.DOCUMENT) {
                let { anchorEl, order } = embedSpec.locatePreviewAnchor(this) ?? {};
                if (!anchorEl || !order) return;
                if (!this.sizerEl.contains(anchorEl)) return;  // anchorEl isn't in viewport
                if (order < 0) {
                    while (anchorEl.previousElementSibling.matches(".evergarden.auto-embed")) {
                        if (anchorEl.previousElementSibling.dataset.embedOrder < 0
                            && anchorEl.previousElementSibling.dataset.embedOrder > order
                        ) {
                            anchorEl = anchorEl.previousElementSibling;
                        }
                    }
                    anchorEl.before(el);
                } else {
                    while (anchorEl.nextElementSibling.matches(".evergarden.auto-embed")) {
                        if (anchorEl.nextElementSibling.dataset.embedOrder >= 0
                            && anchorEl.nextElementSibling.dataset.embedOrder <= order
                        ) {
                            anchorEl = anchorEl.nextElementSibling;
                        }
                    }
                    anchorEl.after(el);
                }
            }

            // After document, before footnotes
            else if (embedSpec.order < ORDER.FOOTNOTES) {
                if (!isBottomInView) return;

                // First embed of this category
                if (!hasBeforeFootnotes) {
                    hasBeforeFootnotes = true;
                    anchorEl = lastEl;
                    while (anchorEl.hasClass("mod-footer")
                        || anchorEl.hasClass("evergarden")  // Fix redraw ordering
                        || anchorEl.querySelector(":scope > .footnotes")
                    ) {
                        anchorEl = anchorEl.previousElementSibling;
                    }
                }
                anchorEl.after(el);
                anchorEl = el;
            }

            // After footnotes, before backlinks
            else {
                if (!isBottomInView) return;

                // First embed of this category
                if (!hasBeforeBacklinks) {
                    hasBeforeBacklinks = true;
                    anchorEl = lastEl.hasClass("mod-footer")
                        ? lastEl.previousElementSibling
                        : lastEl;
                }
                anchorEl.after(el);
                anchorEl = el;
            }
        })
    };

    /**
     * Removes embed in header and footer.
     * Bind this function to MarkdownPreviewView or MarkdownSourceView.
     * @example
     * this.unembedHeaderFooter.call(leaf.view.currentMode)
     */
    unembedHeaderFooter = function() {
        if (this.type === "preview") {
            this.renderer.header.el
                .querySelectorAll(":scope > .evergarden.auto-embed")
                .forEach(element => element.remove());
            this.renderer.footer.el
                .querySelectorAll(":scope > .evergarden.auto-embed")
                .forEach(element => element.remove());
        } else if (this.type === "source") {
            this.sizerEl.querySelectorAll(":scope > .evergarden.auto-embed")
                .forEach(element => element.remove());
        }
    }
    
    /**
     * Called after MarkdownPreviewView.show or (W0 as MarkdownSourceView).show
     * @returns {null}
     */
    updateHeaderFooterEmbeds = async function() {
        let isPreview;
        if (this.type === "preview") {
            // this: MarkdownPreviewView = MarkdownView.previewMode
            isPreview = true;
        } else {  // this.type === "source"
            // this: MarkdownSourceView = MarkdownView.editMode
            isPreview = false;

            if (this.sourceMode) return;  // Skip header & footer embed in source mode
        }

        if (!customJS.AutoEmbed) return;
        if (!this.view.embedRecycler) {
            this.view.embedRecycler = new customJS.AutoEmbed.EmbedRecycler();
        }
        const embedRecycler = this.view.embedRecycler;

        const ORDER = customJS.AutoEmbed.ORDER;
        const embedUpdates = customJS.AutoEmbed._embeds.map(async (embedSpec) => {
            // Filter embeds in header and footer
            if(!(
                (embedSpec.order >= ORDER.VIEWPORT_TOP && embedSpec.order < ORDER.PROPERTIES)
                || (embedSpec.order >= ORDER.BACKLINKS && embedSpec.order < ORDER.VIEWPORT_BOTTOM)
            )) return;

            // Wait until MarkdownView.loadFile() has executed
            try {
                await new Promise((resolve, reject) => {
                    if (this.view.file) resolve();
                    const startTime = Date.now();
                    const checkFileLoaded = setInterval(() => {
                        if (this.view.file !== undefined) {
                            clearInterval(checkFileLoaded);
                            resolve();
                        } else if (Date.now() - 1000 > startTime) {
                            clearInterval(checkFileLoaded);
                            reject(new Error("MarkdownView haven't load file after 1000 ms."));;
                        }
                    }, 10);
                });
            } catch (e) {
                console.error(e);
                return;
            }

            // Shouldn't embed
            if (!embedSpec.shouldEmbed(this.view)) return;

            // Embedded element
            let el = embedRecycler.get(embedSpec);
            if (!el) {
                el = createDiv({
                    cls: "evergarden auto-embed",
                    attr: {
                        "data-embed-id": embedSpec.id,
                        "data-embed-order": embedSpec.order,
                    },
                });
                embedSpec.renderEmbed(el, this.view);
                embedRecycler.push(embedSpec, el);
            }

            // Find embed location
            if (embedSpec.order < ORDER.INLINE_TITLE) {
                this.view.inlineTitleEl.before(el);
            }
            else if (embedSpec.order < ORDER.PROPERTIES) {
                this.view.metadataEditor.containerEl.before(el);
            }
            else {
                isPreview
                    ? this.renderer.footer.el.appendChild(el)
                    : this.sizerEl.appendChild(el);
            }
        });
        for (const embedUpate of embedUpdates) {
            await embedUpate;
        }
    }

    wrapMarkdownSourceView(around) {
        const updateHeaderFooterEmbeds = this.updateHeaderFooterEmbeds;
        const unembedHeaderFooter = this.unembedHeaderFooter;
        const autoEmbedUpdateEffect = this.autoEmbedUpdateEffect;
        if (this.app.workspace.getActiveFileView()) {
            return around(
                this.app.workspace.getActiveFileView().editMode.constructor.prototype,
                {
                    // MarkdownSourceView.show
                    // Triggers when showing edit mode
                    show(origianlShow) {
                        return function() {
                            origianlShow.apply(this, arguments);
                            updateHeaderFooterEmbeds.call(this);
                        }
                    },
                    // MarkdownSourceView.toggleSource
                    // Triggers when toggle between Live Preview mode and Source mode
                    toggleSource(originalToggleSource) {
                        return function() {
                            originalToggleSource.apply(this, arguments);
                            if (this.sourceMode) {
                                unembedHeaderFooter.call(this);
                            } else {
                                updateHeaderFooterEmbeds.call(this);
                            }
                            this.cm.dispatch({
                                effects: autoEmbedUpdateEffect.of()
                            });
                        }
                    }
                }
            );
        }
    }

    /**
     * Rerender embeds in a view
     * @param {MarkdownView} view 
     * @returns {null}
     */
    rerenderView(view) {
        if (this.isInBackground(view)) return;
        this.unembedMarkdownView(view);
        this.unembedHeaderFooter.call(view.currentMode);
        this.embedMarkdownView(view);
        this.updateHeaderFooterEmbeds.call(view.currentMode);
        view?.previewMode?.rerender();
        view?.editMode?.editor.cm.dispatch({
            effects: this.autoEmbedUpdateEffect.of()
        });
    }

    /**
     * Rerender embeds for all markdown view
     */
    rerender = obsidian.debounce(() => {
        this.app.workspace.getLeavesOfType('markdown').forEach((leaf) => {
            this.rerenderView(leaf.view)
        });
    }, 100);

    /**
     * The view is not visible, in a background tab
     * @param {MarkdownView} view 
     * @returns {boolean}
     */
    isInBackground(view) {
        return !view?.headerEl;
    }
    
    EmbedRecycler = class {
        _embeds = new Map();

        push(embedSpec, el) {
            this._embeds.set(embedSpec.id, el);
        }

        get(embedSpec) {
            return this._embeds.get(embedSpec.id);
        }

        has(embedSpec) {
            return this._embeds.has(embedSpec.id);
        }
    }
}