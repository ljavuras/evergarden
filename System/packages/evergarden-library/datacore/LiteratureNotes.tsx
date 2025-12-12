/**
 * List literature notes that link to source file that embeds this component.
 * 
 * @todo Allow a single literature note appear twice if it references two
 * locations of the same source
 * @author Ljavuras <ljavuras.py@gmail.com
 */

/** Options */

// Datacore query to locate literature notes
const LiteratureNoteCriteria = "#zettel/literature";

/**
 * Finds literature notes that links to current file. Extracts the correct
 * locator if the literature note references multiple sources.
 * @returns {Array} - List of references and associalted locator
 */
function useLiteratureNotes() {
    const file = dc.useCurrentFile();
    const query = `@page and ${LiteratureNoteCriteria}`;
    const notes = dc.useQuery(query)
    .map(page => {
        const index = page.$frontmatter?.["literature/reference"]?.value
            .findIndex(link => link?.path == file.$path);

        if (index == -1 || isNaN(index)) {
            return null;
        } else {
            return {
                note: page.$link,
                locator: page.$frontmatter["literature/reference/locator"]
                    ?.value[index],
                created: page.$frontmatter.created
            };
        }
    })
    .filter(note => note)
    /**
     * Sort notes by
     * - First integer found in locator
     * - Created time
     */
    .sort((a, b) => {
        function comparator(a, b) {
            if (a > b) { return 1; }
            else if (a < b) { return -1; }
            else { return 0; }
        }
        const keyFuncs = [
            (note) => parseInt(note.locator?.match(/\d+/)?.[0]),
            (note) => note.created?.value.ts
        ];
        let result = 0
        for (const keyFunc of keyFuncs) {
            result = comparator(keyFunc(a), keyFunc(b));
            if (result != 0) { return result; }
        }
        return result;
    });
    
    return notes;
}

function LiteratureNotes() {
    const literatureNotes = useLiteratureNotes();
    return (
    <>
        <div className="literature-notes-header">{literatureNotes.length} literature notes</div>
        {literatureNotes.length > 0 &&
            <dc.Table
                rows={literatureNotes}
                columns={[
                    {
                        id: "locator",
                        value: (row) => row.locator,
                        width:"minimum",
                        title: (
                            <>
                                <dc.Icon icon="map-pin" />
                                Locator
                            </>
                        )
                    },
                    {
                        id: "note",
                        value: (row) => <dc.Link link={row.note} />,
                        title: (
                            <>
                                <dc.Icon icon="file" />
                                Note
                            </>
                        )
                    },
                ]}
            />
        }
    </>
    )
}

return LiteratureNotes;