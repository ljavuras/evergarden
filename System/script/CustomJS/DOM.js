/**
 * DOM manipulation
 */

class DOM {

    /**
     * Creates a new HTMLElement with predefined header and row
     * @param {HTMLElement[]} [header] - Array of html elements as header
     * @param {HTMLElement[][]} [rows] - 2D array of html elements
     */
    newTable(param) {
        const header = param.header;
        const rows   = param.rows;
        const selector = {
            id: param.id,
        };

        const table = document.createElement('table');
        table.createTBody();
        if (param.id.table) { table.id = selector.id.table; }

        // TODO: type check
        // Insert header
        if (header) {
            const theadRow = table.createTHead().insertRow();
            for (const headerItem of header) {
                theadRow.insertCell().appendChild(headerItem);
            }
        }

        table.updateRows = function(rows) {
            let tbody_new = document.createElement('tbody');
            for (const row of rows) {
                const tRow = tbody_new.insertRow();
                for (const rowItem of row) {
                    tRow.insertCell().appendChild(rowItem);
                }
            }

            this.tBodies[0].replaceWith(tbody_new);
        }

        // Insert rows
        table.updateRows(rows);

        return table;
    }
}
