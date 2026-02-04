const { Datacore } = VPS.require("violet-datacore");
dc = Datacore.wrap(dc);

const { combineClasses } = await dc.require("evergarden-design-system", "utils");
const {
    InternalLink,
    SelfHandledInternalLink,
} = await dc.require("evergarden-design-system", "Primitive");

function List({ className, children, ...props }) {
    return (
        <div
            className={combineClasses("evergarden list-container", className)}
            {...props}
        >
            {children}
        </div>
    )
}

function ListItem({
    className,
    children,
    clickable,
    link,
    selfHandle,
    sourcePath="",
    ...props
}) {
    if (link) {
        const Link = selfHandle? SelfHandledInternalLink : InternalLink;
        return (
            <Link
                className={combineClasses(
                    "evergarden list-item is-clickable",
                    className
                )}
                link={link}
                sourcePath={sourcePath}
            >
                {children}
            </Link>
        )
    } else {
        return (
            <div
                className={combineClasses(
                    "evergarden list-item",
                    className,
                    clickable? "is-clickable" : null
                )}
                {...props}
            >
                {children}
            </div>
        )
    }
}

return { List, ListItem }