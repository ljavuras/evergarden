/**
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

class Utility {

    fileType = {

        /**
         * These extension sets represents file types from user's perspective,
         * rather than 1-1 correlate to MIME types. For example, javascript's
         * MIME type is `text/javascript`, but here it's under catagory
         * executable.
         */
        extensions: {
            image: new Set([
                'png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'tif',
                'tiff', 'eps', 'apng', 'avif', 'ico'
            ]),
            audio: new Set([
                'aac', 'cda', 'mp3', 'oga', 'opus', 'wav', 'weba', '3gp', '3g2',
                'm4a', 'ogg', 'flac'
            ]),
            video: new Set([
                'avi', 'mp4', 'mpeg', 'ogv', 'webv', '3gp', 'mpg', 'mov', 'wmv',
            ]),
            archive: new Set([
                'bz', 'bz2', 'gz', 'rar', 'tar', 'zip', '7z'
            ]),
            text: new Set([
                'css', 'csv', 'html', 'json', 'jsonld', 'txt', 'xhtml', 'xml'
            ]),
            document: new Set([
                'doc', 'docx', 'epub', 'odp', 'ods', 'odt', 'pdf', 'ptt', 'pttx',
                'rtf', 'xls', 'xlsx'
            ]),
            executable: new Set([
                'jar', 'js', 'mjs', 'sh', 'exe'
            ]),
        },

        lookup(extension) {
            extension = extension.toLowerCase();

            for (const [extension_type, extension_set] of Object.entries(this.extensions)) {
                if (extension_set.has(extension)) {
                    return extension_type;
                }
            }

            return "unrecognized";
        },
    };
}