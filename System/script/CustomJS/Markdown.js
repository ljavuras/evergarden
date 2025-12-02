/**
 * Markdown manipulation in Obsidian
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

class Markdown {
    /**
     * Insert content into file under a header
     * @param {TFile} tfile - File to insert into
     * @param {String} heading - Heading to insert under
     * @param {String} content - Inserted content
     * @param {Boolean} append - Append if true, prepend if false
     */
    insertToHeading(tfile, heading, content, append = true) {
        let metadataCache = app.metadataCache.getFileCache(tfile);
        const headingSectionIndex = metadataCache.sections
            .findIndex((section) => {
                return section.position.start.line == metadataCache.headings
                    .find((cachedHeading) => cachedHeading.heading == heading)
                    .position.start.line;
            });

        const headingSection = metadataCache.sections[headingSectionIndex];
        const nextSection = metadataCache.sections[headingSectionIndex + 1];

        let insertOffset;
        let vSpacingBefore = '';
        let vSpacingAfter = '';
        let isLastSection = false;
        if (nextSection == undefined) {
            // heading is last section
            insertOffset = headingSection.position.end.offset;
            vSpacingBefore = '\n\n';
            isLastSection = true;
        } else if (nextSection.type == "heading") {
            // heading is followed by another heading
            insertOffset = headingSection.position.end.offset;
            let vSpacing = nextSection.position.start.offset
                         - headingSection.position.end.offset;
            if (vSpacing > 3) {
                insertOffset += 2;
            } else if (vSpacing == 3) {
                insertOffset += 1;
                vSpacingBefore = '\n';
            } else if (vSpacing == 2) {
                vSpacingBefore = '\n\n';
            } else {  // vSpacing == 1
                vSpacingBefore = '\n\n';
                vSpacingAfter = '\n';
            }
        } else {
            // Insert content to next section
            if (append) {
                insertOffset = nextSection.position.end.offset;
                vSpacingBefore = '\n';
            } else {
                insertOffset = nextSection.position.start.offset;
                vSpacingAfter = '\n';
            }
        }
        app.vault.process(tfile, (data) => {
            return data.slice(0, insertOffset)
                + vSpacingBefore
                + content
                + (isLastSection? '' :
                ( vSpacingAfter
                + data.slice(insertOffset)));
        });
    }
}