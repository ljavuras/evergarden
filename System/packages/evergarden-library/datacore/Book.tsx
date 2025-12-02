/**
 * UI for book related datacore components
 *
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

const {
    useState,
    useRef,
    useEffect
} = dc;

function InternalLink({ link, className, children, ...props }) {
    return <a
                aria-label={link.displayOrDefault()}
                className={"internal-link " + className}
                target="_blank"
                rel="noopener"
                data-tooltip-position="top"
                data-href={link.obsidianLink()}
                href={link.obsidianLink()}
                {...props}
            >
                {children ?? link.displayOrDefault()}
            </a>
}

function ExternalLink({ href, className, children, ...props }) {
    return (
        <a
            rel="noopener nofollow"
            className={`external-link ${className}`}
            href={href}
            target="_blank"
        >
            {children ?? href}
        </a>
    )
}

/**
 * Adds ", " between inline elements
 */
function InlineList({ children }) {
    return (
        <>
            {
                dc.preact.toChildArray(children)
                .map((child, index, array) => (
                    <>
                        {child}
                        {index < array.length - 1? ", " : null}
                    </>
                ))
            }
        </>
    )
}

function Authors({ authors }) {
    return (
        <div className="authors">
            <InlineList>
                {
                    authors?.map((link, index, array) => (
                        <dc.Link link={link} />
                    ))
                }
            </InlineList>
        </div>
    )
}

function AutoResizingTextInput({ value, minWidth, onChange }) {
    const [inputValue, setInputValue] = useState(value);
    const [width, setWidth] = useState(0);
    const inputRef = useRef(null);
    const spanRef = useRef(null);

    useEffect(() => {
        if (spanRef.current && inputRef.current) {
            setWidth(Math.max(
                minWidth ?? 0,
                spanRef.current.offsetWidth
            ));
        }
    }, [inputValue]);

    return (
        <>
            <input
                type="text"
                ref={inputRef}
                value={inputValue}
                style={{ width }}
                onChange={(event) => {
                    onChange(event);
                    setInputValue(event.target.value);
                }}
                onKeyUp={(event) => {
                    // Unfocus when Enter is pressed
                    if (event.keyCode == 13) {
                        event.preventDefault();
                        event.target.blur();
                    }
                }}
            />
            <span
                ref={spanRef}
                style={{
                    visibility: "hidden",
                    position: "absolute",
                    whiteSpace: "nowrap",
                }}
            >{inputValue}</span>
        </>
    )
}

function ProgressBar({ progress, length, path }) {
    progress = progress ?? 0;
    return (
        <div className="progress">
            <div className="progress-label">
                <AutoResizingTextInput
                    value={progress}
                    onChange={(event) => {
                        if (isNaN(event.target.value)) {
                            event.target.value = progress;
                            return;
                        }
                        customJS.Obsidian.frontmatter.set(
                            customJS.Obsidian.vault.getFile(path),
                            {"library/progress": Number(event.target.value)}
                        )
                    }}
                />
                /
                <AutoResizingTextInput
                    value={length}
                    onChange={(event) => {
                        if (isNaN(event.target.value)) {
                            event.target.value = length;
                            return
                        }
                        customJS.Obsidian.frontmatter.set(
                            customJS.Obsidian.vault.getFile(path),
                            {"library/length": Number(event.target.value)}
                        )
                    }}
                />
            </div>
            <div className="progress-bar">
                <div
                    style={{width: `${(progress)/length * 100}%`}}
                ></div>
            </div>
        </div>
    )
}

/**
 * @typedef {object} StatusSelectProps
 * @property {string} defaultValue - Displayed value
 * @property {string} path - Path of note which this select modifies
 *
 * @param {StatusSelectProps} props
 * @returns {preact.VNode}
 */
function StatusSelect({ defaultValue, path }) {
    return (
        <select
            className="dropdown status"
            defaultValue={defaultValue}
            onChange={handleStatusChangeFactory(path)}
        >
            <option value="" hidden>Status</option>
            <option value="not owned">Not owned</option>
            <option value="on wishlist">On wishlist</option>
            <option value="borrowed">Borrowed</option>
            <option value="owned">Owned</option>
            <option value="lent out">Lent out</option>
        </select>
    )
}

/**
 * @typedef {object} StageSelectProps
 * @property {string} defaultValue - Displayed value
 * @property {string} path - Path of note which this select modifies
 *
 * @param {StageSelectProps} props
 * @returns {preact.VNode}
 */
function StageSelect({ defaultValue, path }) {
    return (
        <select
            className="dropdown stage"
            defaultValue={defaultValue}
            onChange={handleStageChangeFactory(path)}
        >
            <option value="" hidden>Stage</option>
            <option value="to read">To read</option>
            <option value="reading">Reading</option>
            <option value="finished">Finished</option>
            <option value="on hold">On hold</option>
            <option value="abandoned">Abandoned</option>
        </select>
    )
}

function handleStatusChangeFactory(path) {
    return (event) => {
        customJS.Obsidian.frontmatter.set(
            customJS.Obsidian.vault.getFile(path),
            {"library/status": event.target.value}
        );
    }
}

function handleStageChangeFactory(path) {
    return (event) => {
        customJS.Obsidian.frontmatter.set(
            customJS.Obsidian.vault.getFile(path),
            {"library/stage": event.target.value}
        );
    }
}

/**
 * Display book metadata and read button
 */
function BookOverview() {
    const file = dc.useCurrentFile();
    const metadata: any = {};
    for (const key in file?.$frontmatter) {
        if (key.startsWith("library/") && !key.startsWith("library/url/")) {
            metadata[key.slice(8)] = file.$frontmatter[key].value;
        }
    }
    // Datacore forces frontmatter keys to lowercase, fix it for `url/*` where
    // uppercase matters
    for (const [key, value] of Object.entries(
        dc.app.metadataCache.getCache(file.$path)?.frontmatter
    )) {
        if (key.startsWith("library/url/")) {
            metadata[key.slice(8)] = value;
        }
    }
    const rating = metadata.rating ?? metadata['rating/community'];

    // Always open file in new tab
    function openFileHandler(event) {
        event.stopPropagation();
        const activeLeaf = app.workspace.getLeaf(true);
        activeLeaf.openFile(
            app.vault.getAbstractFileByPath(
                metadata.file.path
            )
        )
    }

    /**
     * Fix mistake made by goodreads-clipper
     * For books don't belong to any series, goodreads-clipper template will
     * produce a single link: [[(Series)]].
     * It is caused by the split fliter, which generates [""] from empty
     * string, potentially unfixable with clipper template alone.
     */
    if (metadata.series?.[0]?.path == "(Series)") {
        customJS.Obsidian.frontmatter.set(
            customJS.Obsidian.vault.getFile(file.$path),
            {"library/series": []}
        )
    }

    return (
        <div className="evergarden book-overview">
            <div className="cover">
                <img src={metadata.cover} />
            </div>
            <div className="overview">
                <div className="info">
                    <div className="col1">
                        <Authors authors={metadata.author} />
                        <div className="publish">
                            <InlineList>
                                {metadata['publish/publisher']}
                                {metadata['publish/date']?.year}
                            </InlineList>
                        </div>
                        <div className="series">
                            <InlineList>
                                {
                                    metadata.series
                                    ?.map((link, index, array) => (
                                        link.fileName().endsWith(" (Series)")
                                        ? (
                                            <>
                                                <dc.Link
                                                    link={link.withDisplay(
                                                        link.fileName().replace(/ \(Series\)$/, "")
                                                    )}
                                                />
                                                {`(#${metadata['series/no'][index]})`}
                                            </>
                                        )
                                        : null
                                    ))
                                    .filter(series => series)
                                }
                            </InlineList>
                        </div>
                    </div>
                    <div className="col2">
                        {
                            metadata.language
                            ? <div className="language">{metadata.language}</div>
                            : null
                        }
                        {
                            metadata.edition
                            ? <div className="edition">{metadata.edition}</div>
                            : null
                        }
                        {
                            metadata.isbn
                            ? (
                                <div
                                    className="isbn"
                                    onClick={() => {
                                        navigator.clipboard.writeText(metadata.isbn);
                                        new Notice("ISBN copied to clipboard.");
                                    }}
                                >
                                    {metadata.isbn}
                                    <dc.Icon icon="clipboard" />
                                </div>
                            )
                            : null
                        }
                    </div>
                </div>
                <div className="genres">
                    {
                        metadata.genre
                        ?.filter((link) => link.fileName().startsWith("a-"))
                        ?.map((link) => {
                            return (
                                <dc.Link
                                    link={
                                        link.withDisplay(
                                            link.fileName().slice(2)
                                        )
                                    }
                                />
                            )
                        })
                    }
                    {
                        Object.entries(metadata)
                        ?.filter(([key, value]) => {
                            return key.startsWith("url/");
                        })
                        .map(([key, url]) => (
                            <ExternalLink href={url}>
                                {key.slice(4)}
                            </ExternalLink>
                        ))
                    }
                </div>
                <div className="ratings">
                    <div className="stars">
                        <div className="background">
                            {
                                [...Array(5)].map(() => (
                                    <div className="star-container">
                                        <dc.Icon icon="star" />
                                    </div>
                                ))
                            }
                        </div>
                        <div className="foreground">
                            {
                                [...Array(Math.floor(rating))]
                                .map(() => (
                                <div className="star-container">
                                    <dc.Icon icon="star" />
                                </div>
                                ))
                            }{
                                (rating % 1) > 0
                                ? (
                                    <div
                                        className="star-container"
                                        style={{width: `calc(var(--icon-size) * ${(rating % 1)})`}}
                                    >
                                        <dc.Icon icon="star" />
                                    </div>
                                )
                                : null
                            }
                        </div>
                    </div>
                    <div className="rating-details">
                        {rating}
                        {
                            (!metadata.rating && metadata['rating/community/count'])
                            ? (
                                <span className="rating-count">
                                    {
                                        metadata['rating/community/count']
                                        .toString()
                                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")  // Thousand separator
                                    } rating{metadata['rating/community/count'] > 1? "s" : null}
                                </span>
                            )
                            : null
                        }
                    </div>
                </div>
                <ProgressBar
                    progress={metadata.progress}
                    length={metadata.length}
                    path={file.$path}
                />
                <div className="actions">
                    <button
                        className="action-read mod-cta"
                        onClick={openFileHandler}
                        disabled={!metadata.file}
                    >
                        Read now
                    </button>
                    <StatusSelect
                        defaultValue={metadata.status}
                        path={file.$path}
                    />
                    <StageSelect
                        defaultValue={metadata.stage}
                        path={file.$path}
                    />
                </div>
            </div>
        </div>
    )
}

function useBooks() {
    const file = dc.useCurrentFile();
    const query = `@page and #a/source/book`;
    const books = dc.useQuery(query)
    .map(page => {
        const index = page.$frontmatter["library/series"].value
            .findIndex(link => link?.path == file.$path);

        if (index == -1) {
            return null;
        } else {
            const metadata: any = {};
            for (const key in page.$frontmatter) {
                if (key.startsWith("library/") && !key.startsWith("library/url/")) {
                    metadata[key.slice(8)] = page.$frontmatter[key].value;
                }
            }
            // Preserve uppercase keys, Datacore forces lowercase
            for (const [key, value] of Object.entries(
                dc.app.metadataCache.getCache(page.$path)?.frontmatter
            )) {
                if (key.startsWith("library/url/")) {
                    metadata[key.slice(8)] = value;
                }
            }
            return {
                link: page.$link,
                metadata: metadata,
                no: metadata['series/no'][index],
            };
        }
    })
    .filter(note => note);

    return books;
}

/**
 * Lists all book that belongs to the same series.
 */
function BookSeries() {
    const file = dc.useCurrentFile();
    const books = dc.useArray(useBooks(), array => array.groupBy(book => book.no));
    return (
        <div className="evergarden book-series">
            <div className="series-header">
                <h1 className="series-title">{file.$name.slice(0, -9)} Series</h1>
                <div className="series-detail">{books.length} in library</div>
            </div>
            <dc.List
                type="block"
                rows={books}
                groupings={{render: (key, rows) => (
                    <>
                        <div className="no-divider"></div>
                        <div className="no-title">{`Book ${key}`}</div>
                    </>
                )}}
                renderer={book => (
                    <div className="book">
                        <InternalLink
                            className="cover"
                            link={book.link}
                        >
                            <img src={book.metadata.cover} />
                        </InternalLink>
                        <div className="info">
                            <div className="title">
                                <dc.Link
                                    link={book.link.withDisplay(book.metadata.title)}
                                />
                            </div>
                            <Authors authors={book.metadata.author} />
                            <div className="edition">
                                <InlineList>
                                    {book.metadata['publish/date']?.year}
                                    {book.metadata.edition}
                                </InlineList>
                            </div>
                            <ProgressBar
                                progress={book.metadata.progress}
                                length={book.metadata.length}
                                path={book.link.path}
                            />
                            <div className="action-bar">
                                <StatusSelect
                                    defaultValue={book.metadata.status}
                                    path={book.link.path}
                                />
                                <StageSelect
                                    defaultValue={book.metadata.stage}
                                    path={book.link.path}
                                />
                            </div>
                        </div>
                    </div>
                )}
            />
        </div>
    );
}

return { BookOverview, BookSeries };