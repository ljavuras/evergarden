/**
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

const { app, obsidian } = await cJS();

const { Datacore } = VPS.require("violet-datacore");
dc = Datacore.wrap(dc);

const { combineClasses } = await dc.require("evergarden-design-system", "utils");

function InternalLink({ link, className, children, ...props }) {
    return (
        <a
            aria-label={link.displayOrDefault()}
            className={combineClasses("internal-link", className)}
            target="_blank"
            rel="noopener"
            data-tooltip-position="top"
            data-href={link.obsidianLink()}
            href={link.obsidianLink()}
            {...props}
        >
            {children ?? link.displayOrDefault()}
        </a>
    )
}

/**
 * Attach internal links' click (navigate to note) and mouseover (show hover
 * preview) event handlers by itself. Use this component when the internal
 * link isn't contained in `MarkdownView`, which attaches the handlers
 * automatically for internal link anchor tags.
 * 
 * {@link https://forum.obsidian.md/t/internal-links-dont-work-in-custom-view/90169/3}
 * {@link https://github.com/mnaoumov/obsidian-dev-utils/blob/6e744dd2b142b6bbf7d9a4f99f3635fa91a2a6b6/src/obsidian/Markdown.ts#L165}
 */
function SelfHandledInternalLink({
    link,
    sourcePath="",
    ...props
}) {
    return (
        <InternalLink
            link={link}
            onClick={event => {
                const linktext = link.obsidianLink();
                if (linktext) {
                    // onInternalLinkClick
                    app.workspace.openLinkText(
                        linktext,
                        sourcePath,
                        obsidian.Keymap.isModEvent(event)
                    );
                }
            }}
            onMouseOver={event => {
                const linktext = link.obsidianLink();
                if (linktext) {
                    // onInternalLinkMouseover
                    app.workspace.trigger("hover-link", {
                        event,
                        source: "preview",
                        hoverParent: { hoverPopover: null },
                        targetEl: event.currentTarget,
                        linktext: linktext,
                        sourcePath: sourcePath,
                    });
                }
            }}
            {...props}
        />
    )
}

function ExternalLink({ href, className, children, ...props }) {
    return (
        <a
            rel="noopener nofollow"
            className={combineClasses("external-link", className)}
            href={href}
            target="_blank"
        >
            {children ?? href}
        </a>
    )
}

function Pill({ className, children, link, ...props }) {
    return (link
        ? <InternalLink
            className={combineClasses("evergarden pill interactive", className)}
            link={link}
            {...props}
        >
            {children}
        </InternalLink>
        : <span
            className={combineClasses("evergarden pill", className)}
            {...props}
        >
            {children}
        </span>
    )
}

function Button(
    { className="", mod, isLoading, children, ...props }
    : {
        className: string,
        mod: null | "cta" | "warning" | "destructive" | "cancel",
        isLoading: boolean,
        children: ComponentChildren,
        props: any
    }
) {
    return (
        <button
            className={combineClasses(
                "evergarden",
                mod? ` mod-${mod}` : null,
                isLoading? " mod-loading": null,
                className,
            )}
            {...props}
        >
            {children}
        </button>
    )
}

function ClickableIcon({
    className, 
    icon,
    onClick,
    isActive,
    disabled,
    label,
    ...props
}) {
    return (
        <div
            className={combineClasses(
                "clickable-icon ",
                className,
                isActive? " is-active" : "",
            )}
            aria-disabled={disabled}
            aria-label={label}
            onClick={onClick}
            {...props}
        >
            <dc.Icon icon={icon} />
        </div>
    )
}

return {
    InternalLink,
    SelfHandledInternalLink,
    ExternalLink,
    Pill, 
    Button,
    ClickableIcon,
}