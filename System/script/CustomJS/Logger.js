/**
 * Provide custom error type
 * 
 * - customJS.VaultError: Error occurs in custom scripts within the vault
 * 
 * @author Ljavuras <ljavuras.py@gmail.com>
 */

class Logger {
    constructor() {
        customJS.VaultError = class extends global.Error {
            constructor(message) {
                super(message);
                this.name = "VaultError";
                new customJS.Obsidian.Notice("<strong>Vault Error</strong>" + (message? ":\n" + message : ""));
            }
        }
    }
}