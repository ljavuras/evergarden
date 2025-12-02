/**
 * A social media like widget to display conversations
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

// Initialization
let obsidian;
try {
    // Enabled by Modules or Fix Require Modules plugin
    obsidian = require('obsidian');  
} catch {
    obsidian = input?.obsidian     // Provide obsidian api through `dv.view()`
            || (await cJS())?.obsidian  // Get obsidian api from CustomJS plugin
            // Get obsidian api from templater plugin
            || app.plugins.plugins['templater-obsidian']?.templater.current_functions_object.obsidian
            ;
}
if (!obsidian) { /* Handle error */ }

const { Obsidian, Periodic, Templater, Dataview } = await cJS();

const CONVO_TEMPLATE  = "note.convo";
const CONVO_TAG       = "note/convo";
const PROPERTY_PREFIX = "convo/";
const PROPERTY_PARENT = PROPERTY_PREFIX + "replies-to";

let options = {
    locale: input?.locale ?? localStorage.getItem('language') ?? 'en',

    // Available modes: dedicated, recent, comment, periodic, embed
    // Mode determination: input.mode > embed > periodic > comment > recent
    mode: input?.mode? input.mode:
        (input?.src || (typeof input == 'string'))? "embed":
        Periodic.isPeriodic(dv.current().file.name)? "periodic":
        dv.pages(`${dv.current().file.link} and #note/convo`).length? "comment":
        "recent",
    
    // Embed source convo, accepted usage:
    // dv.view("path/to/Convo", { src: "<convo-name>" })
    // dv.view("path/to/Convo", "<convo-name>")
    src: input?.src? input.src:
        (typeof input == 'string')? input:
        undefined,
};

const containerEl = (input?.containerEl || dv.container)
    .createEl('div', { cls: `widget-convo` });

class ConvoCreateInput {
    constructor(containerEl, placeholder, replyToTFile) {
        this.el = (containerEl ?? createFragment()).createDiv("create-convo");
        this._replyToTFile = replyToTFile;
        
        if (!containerEl) {
            this.el.detach();
        }

        this.el.onclick = (event) => {
            createConvoInputEl.focus();
        }
        let createConvoInputEl = this.el.createEl('textarea', {
            cls: "create-convo__input",
            attr: { placeholder: placeholder, rows: 1},
        });
        createConvoInputEl.oninput = (event) => {
            // Resize input to content height
            createConvoInputEl.style.height = '1px';
            createConvoInputEl.style.height = createConvoInputEl.scrollHeight + 'px';
        }
        let createConvoSubmitEl = this.el.createEl('button', {
            cls: "create-convo__submit clickable-icon clickable-icon-text",
        });
        obsidian.setIcon(
            createConvoSubmitEl.createEl('div', { cls: "icon-wrap" }),
            'send'
        );
        createConvoSubmitEl.createEl('span', { text: "Post" });
        createConvoSubmitEl.onclick = async (event) => {
            // Create new convo file with input value
            let convoFile = await Templater
                .createNewFileFromTemplate(
                    // TODO: handle filename exist error
                    `convo.${moment().format('YYYY-MMDD-HHss')}.md`,
                    CONVO_TEMPLATE
                );
            if (this._replyToTFile) {
                Obsidian.frontmatter.set(
                    convoFile,
                    {
                        [PROPERTY_PARENT]: new Obsidian.Link(
                            this._replyToTFile,
                                convoFile.path
                            ).toString(),
                    }
                );
            }
            app.vault.append(convoFile, createConvoInputEl.value);
        };
    }

    replyTo(replyToTFile, containerEl) {
        this._replyToTFile = replyToTFile;
        if (containerEl) {
            containerEl.appendChild(this.el);
        }
    }
}

class Convo {
    constructor(page) {
        this._page = page;
        this._children = dv.pages(`#${CONVO_TAG}`)
            .filter((page) => {
                return this._page.file.link.equals(page[PROPERTY_PARENT]);
            })
            .sort(page => page.created, 'asc')
            .map(page => new Convo(page));
            // TODO: make this work:
            // dv.pages(`"${convo.file.link.markdown()}"`)
            //     .filter(/* filter convo-replies-to */);

        this.el = createFragment().createDiv("convo");

        let convoContentEl = this.el.createDiv("convo__content");
        Obsidian.vault.getFileContent(this._page.file.path)
            .then((convoContent) => {
                Obsidian.renderMarkdown(
                    convoContent,
                    convoContentEl,
                    dv.currentFilePath,
                    dv.component 
                )}
            );

        let convoBottomEl = this.el.createDiv("convo__bottom");

        let relativeTimeText = () => {
            return this._page.created.setLocale(options.locale).toRelative()
                + ', '
                + this._page.created.setLocale(options.locale).toFormat('EEE');
        }
        let timeText = () => {
            return this._page.created.setLocale(options.locale)
            .toLocaleString(DataviewAPI.luxon.DateTime.DATETIME_SHORT);
        }
        let convoTimeEl = convoBottomEl.createSpan({
            cls: "convo__time",
            text: relativeTimeText(),
        }); 
        convoTimeEl.onmouseenter = (event) => {
            convoTimeEl.textContent = timeText();
        };
        convoTimeEl.onmouseleave = (event) => {
            convoTimeEl.textContent = relativeTimeText();
        }

        let replyButton = convoBottomEl.createEl('button', {
            cls: "clickable-icon",
        });
        obsidian.setIcon(replyButton, 'reply');
        obsidian.setTooltip(replyButton, "Reply");
        replyButton.onclick = (event) => {
            this._expandComment();
            feed.commentInput.replyTo(
                Dataview.getFile(this._page),
                this.commentSectionEl
            );
        }

        let expandCommentButton = convoBottomEl.createEl('button', {
            cls: "convo__show-comment clickable-icon clickable-icon-text",
            text: this._children.length ?? "",
        });
        obsidian.setIcon(
            expandCommentButton.createDiv("icon-wrap"),
            'message-circle'
        );
        obsidian.setTooltip(expandCommentButton, "Comments");
        expandCommentButton.onclick = (event) => {
            if (this._isExpand()) {
                this._collapseComment();
            } else {
                this._expandComment();
                feed.commentInput.replyTo(
                    Dataview.getFile(this._page),
                    this.commentSectionEl
                );
            }
        }

        let copyLinkButton = convoBottomEl.createEl('button', {
            cls: "clickable-icon"
        });
        obsidian.setIcon(copyLinkButton, 'copy');
        obsidian.setTooltip(copyLinkButton, "Copy link")
        copyLinkButton.onclick = (event) => {
            navigator.clipboard.writeText(this._page.file.link.markdown());
            new Notice("Markdown link copied to clipboard.");
        }

        let linkAnchor = convoBottomEl.createEl('a', {
            cls: "convo__link internal-link clickable-icon",
            attr: {
                'data-tooltip-position': 'top',
                'aria-label': this._page.file.name,
                'data-href': this._page.file.name,
                href: this._page.file.name,
                target: '_blank',
                rel: 'noopener',
            }
        })
        obsidian.setIcon(linkAnchor, 'link');

        this.commentSectionEl = this.el.createDiv("convo__comment-section");
    }

    _isExpand() {
        return !(this.commentSectionEl.hasClass("hide") 
                || !this.commentSectionEl.hasChildNodes());
    }

    _expandComment() {
        this.commentSectionEl.removeClass("hide");
    }

    _collapseComment() {
        this.commentSectionEl.addClass("hide");
    }

    render(containerEl) {
        containerEl.appendChild(this.el);
        for (let commentConvo of this._children) {
            commentConvo.render(this.commentSectionEl);
        }
    }
}

/**
 * Convo feed
 */

let convos;
switch (options.mode) {
    case "dedicated":
        convos = dv.pages(`#${CONVO_TAG}`)
            .filter(page => !page[PROPERTY_PARENT]);
        break;
    case "recent":
        convos = dv.pages(`#${CONVO_TAG}`)
            .filter(page => !page[PROPERTY_PARENT])
            .filter(page => {
                return DataviewAPI
                    .luxon.DateTime.now().diff(page.created, 'days').days < 7
            });
        break;
    case "comment":
        convos = dv
            .pages(`${dv.current().file.link} and #${CONVO_TAG}`)
            .filter((page) => {
                return dv.current().file.link.equals(page[PROPERTY_PARENT])
            });
        break;
    case "periodic":
        convos = dv.pages(`#${CONVO_TAG}`)
            .filter(page => !page[PROPERTY_PARENT])
            .filter((page) => {
                return Periodic
                    .get(dv.current().file.name)
                    .includes(page.created.ts);  // luxon to unix timestamp
            });
        break;
    case "embed":
        convos = [
            dv.page(Obsidian.vault.getFileByName(options.src).path)
        ];
        break;
}

let feed = {
    convos: convos
        .map((page) => {
            page.topLevel = true;
            return page
        })
        .sort(convo => convo.created, 'desc')
        .map(page => new Convo(page)),
    commentInput: new ConvoCreateInput(undefined, "Reply"),
};

/**
 * Render
 */
let widgetTitle = 
    options.mode == "dedicated"? "Convo":
    options.mode == "recent"   ? "Recent convos":
    options.mode == "periodic" ? `Convos of ${dv.current().file.name}`:
    options.mode == "comment"  ? `${feed.convos.length} comment${feed.convos.length > 1? "s" : ""}`:
    "";
if (options.mode != "embed") {
    let topBarEl = containerEl.createDiv("widget__top-bar");
    topBarEl.createEl("h2", { cls: "widget-title", text: widgetTitle });
    switch(options.mode) {
        case "dedicated":
        case "recent":
        case "periodic":
            new ConvoCreateInput(
                topBarEl,
                "Start a convo"
            );
            break;
        case "comment":
            new ConvoCreateInput(
                topBarEl,
                "Write a comment",
                Dataview.getFile(dv.current())
            );
            break;
    }
}

for (let convo of feed.convos) {
    convo.render(containerEl);
}
